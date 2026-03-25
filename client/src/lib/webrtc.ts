import type { Socket } from 'socket.io-client'
import { API_URL } from './config'

export type TransferMeta = {
  name: string
  size: number
  mimeType: string
}

type CommonOpts = {
  otp: string
  socket: Socket
  iceServers?: RTCIceServer[]
  onStatus?: (s: string) => void
  onError?: (e: string) => void
}

const DEFAULT_ICE: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  // TURN placeholder: add your own TURN in production
  // { urls: 'turn:YOUR_TURN_HOST:3478', username: 'user', credential: 'pass' },
]

let cachedIce: RTCIceServer[] | null = null
async function resolveIceServers() {
  if (cachedIce) return cachedIce
  try {
    const resp = await fetch(`${API_URL}/api/rtc-config`)
    if (!resp.ok) throw new Error('rtc-config failed')
    const data = (await resp.json()) as { iceServers?: RTCIceServer[] }
    if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
      cachedIce = data.iceServers
      return cachedIce
    }
  } catch {
    // fallback
  }
  cachedIce = DEFAULT_ICE
  return cachedIce
}

function makePc(iceServers?: RTCIceServer[]) {
  return new RTCPeerConnection({ iceServers: iceServers?.length ? iceServers : DEFAULT_ICE })
}

const CHUNK_SIZE = 64 * 1024

function encodeJson(obj: unknown) {
  return new TextEncoder().encode(JSON.stringify(obj))
}
function decodeJson(data: ArrayBuffer) {
  return JSON.parse(new TextDecoder().decode(new Uint8Array(data)))
}

export function createSenderSession({
  otp,
  socket,
  file,
  iceServers,
  onStatus,
  onProgress,
  onError,
}: CommonOpts & {
  file: File
  onProgress?: (pct: number) => void
}) {
  let pc: RTCPeerConnection | null = null
  let dc: RTCDataChannel | null = null
  let closed = false

  const cleanup = () => {
    if (closed) return
    closed = true
    try {
      dc?.close()
    } catch {}
    try {
      pc?.close()
    } catch {}
    dc = null
    pc = null
  }

  const start = async () => {
    onStatus?.('Connecting…')

    const resolvedIce = iceServers?.length ? iceServers : await resolveIceServers()
    pc = makePc(resolvedIce)
    pc.onicecandidate = (ev) => {
      if (ev.candidate) socket.emit('webrtc_ice', { otp, candidate: ev.candidate })
    }
    pc.onconnectionstatechange = () => {
      const st = pc?.connectionState
      if (!st) return
      if (st === 'failed' || st === 'disconnected') onError?.('Connection lost')
    }

    dc = pc.createDataChannel('file', { ordered: true })
    dc.binaryType = 'arraybuffer'

    dc.onopen = async () => {
      try {
        onStatus?.('Transferring…')

        const meta: TransferMeta = {
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
        }
        dc?.send(encodeJson({ t: 'meta', meta }))

        const total = file.size
        let offset = 0
        let sent = 0

        while (offset < total) {
          if (closed) return
          const slice = file.slice(offset, offset + CHUNK_SIZE)
          const buf = await slice.arrayBuffer()

          // backpressure
          while (dc && dc.bufferedAmount > 4 * 1024 * 1024) {
            await new Promise((r) => setTimeout(r, 20))
          }

          dc?.send(buf)
          offset += buf.byteLength
          sent += buf.byteLength
          const pct = Math.round((sent / total) * 100)
          onProgress?.(pct)
        }

        dc?.send(encodeJson({ t: 'done' }))
        onProgress?.(100)
        onStatus?.('Completed')
        socket.emit('transfer_complete', { otp })
      } catch (e: any) {
        onError?.(e?.message || 'Send failed')
      }
    }

    dc.onerror = () => onError?.('Data channel error')

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socket.emit('webrtc_offer', { otp, sdp: offer })

    const onAnswer = async ({ otp: roomOtp, sdp }: { otp: string; sdp: RTCSessionDescriptionInit }) => {
      if (roomOtp !== otp) return
      if (!pc) return
      await pc.setRemoteDescription(new RTCSessionDescription(sdp))
    }
    const onIce = async ({ otp: roomOtp, candidate }: { otp: string; candidate: RTCIceCandidateInit }) => {
      if (roomOtp !== otp) return
      try {
        await pc?.addIceCandidate(new RTCIceCandidate(candidate))
      } catch {
        // ignore
      }
    }

    socket.on('webrtc_answer', onAnswer)
    socket.on('webrtc_ice', onIce)

    return () => {
      socket.off('webrtc_answer', onAnswer)
      socket.off('webrtc_ice', onIce)
      cleanup()
    }
  }

  return { start, cleanup }
}

export function createReceiverSession({
  otp,
  socket,
  iceServers,
  onStatus,
  onProgress,
  onError,
  onMeta,
  onFile,
}: CommonOpts & {
  onProgress?: (pct: number) => void
  onMeta?: (m: TransferMeta) => void
  onFile?: (blob: Blob, meta: TransferMeta) => void
}) {
  let pc: RTCPeerConnection | null = null
  let meta: TransferMeta | null = null
  let chunks: ArrayBuffer[] = []
  let received = 0
  let closed = false

  const cleanup = () => {
    if (closed) return
    closed = true
    try {
      pc?.close()
    } catch {}
    pc = null
    chunks = []
  }

  const start = async () => {
    onStatus?.('Connecting…')
    const resolvedIce = iceServers?.length ? iceServers : await resolveIceServers()
    pc = makePc(resolvedIce)
    pc.onicecandidate = (ev) => {
      if (ev.candidate) socket.emit('webrtc_ice', { otp, candidate: ev.candidate })
    }
    pc.onconnectionstatechange = () => {
      const st = pc?.connectionState
      if (!st) return
      if (st === 'failed' || st === 'disconnected') onError?.('Connection lost')
    }

    pc.ondatachannel = (ev) => {
      const dc = ev.channel
      dc.binaryType = 'arraybuffer'

      dc.onmessage = (m) => {
        if (typeof m.data === 'string') return

        const buf = m.data as ArrayBuffer
        // try to parse small json messages
        if (buf.byteLength < 4096) {
          try {
            const msg = decodeJson(buf)
            if (msg?.t === 'meta') {
              meta = msg.meta as TransferMeta
              onMeta?.(meta)
              return
            }
            if (msg?.t === 'done') {
              if (!meta) {
                onError?.('Missing metadata')
                return
              }
              const blob = new Blob(chunks, { type: meta.mimeType })
              onProgress?.(100)
              onStatus?.('Completed')
              onFile?.(blob, meta)
              socket.emit('transfer_complete', { otp })
              return
            }
          } catch {
            // fallthrough to treat as binary chunk
          }
        }

        chunks.push(buf)
        received += buf.byteLength
        if (meta?.size) {
          onProgress?.(Math.min(99, Math.round((received / meta.size) * 100)))
        }
      }

      dc.onerror = () => onError?.('Data channel error')
    }

    const onOffer = async ({ otp: roomOtp, sdp }: { otp: string; sdp: RTCSessionDescriptionInit }) => {
      if (roomOtp !== otp) return
      if (!pc) return
      await pc.setRemoteDescription(new RTCSessionDescription(sdp))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('webrtc_answer', { otp, sdp: answer })
      onStatus?.('Connected')
    }

    const onIce = async ({ otp: roomOtp, candidate }: { otp: string; candidate: RTCIceCandidateInit }) => {
      if (roomOtp !== otp) return
      try {
        await pc?.addIceCandidate(new RTCIceCandidate(candidate))
      } catch {
        // ignore
      }
    }

    socket.on('webrtc_offer', onOffer)
    socket.on('webrtc_ice', onIce)

    return () => {
      socket.off('webrtc_offer', onOffer)
      socket.off('webrtc_ice', onIce)
      cleanup()
    }
  }

  return { start, cleanup }
}

