import { useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import Card from './Card'
import OtpBadge from './OtpBadge'
import ProgressBar from './ProgressBar'
import { api, type UploadResponse } from '../lib/api'
import { getSocket } from '../lib/socket'
import { createSenderSession } from '../lib/webrtc'

type Status = 'idle' | 'uploading' | 'waiting' | 'connected' | 'downloading' | 'completed' | 'expired' | 'error'

function prettyBytes(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB']
  let b = bytes
  let i = 0
  while (b >= 1024 && i < units.length - 1) {
    b /= 1024
    i++
  }
  return `${b.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export default function SendPanel() {
  const [file, setFile] = useState<File | null>(null)
  const [otp, setOtp] = useState<string>('')
  const [expiresAt, setExpiresAt] = useState<string>('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string>('Drag & drop a file to generate a 6-digit key.')
  const [uploadPct, setUploadPct] = useState<number>(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const socket = useMemo(() => getSocket(), [])
  const senderStopRef = useRef<null | (() => void)>(null)

  useEffect(() => {
    const onReceiverJoined = ({ otp: roomOtp }: { otp: string }) => {
      if (roomOtp === otp) {
        setStatus((s) => (s === 'waiting' ? 'connected' : s))
        setMessage('Receiver connected. Waiting for download request…')
      }
    }
    const onReceiverReady = ({ otp: roomOtp }: { otp: string }) => {
      if (roomOtp !== otp) return
      if (!file || senderStopRef.current) return

      setStatus('downloading')
      setUploadPct(0)
      setMessage('Connecting…')

      const session = createSenderSession({
        otp,
        socket,
        file,
        onStatus: (s) => setMessage(s),
        onProgress: (pct) => setUploadPct(pct),
        onError: (e) => {
          setStatus('error')
          setMessage(e)
        },
      })
      session
        .start()
        .then((stop) => {
          senderStopRef.current = () => {
            stop?.()
            session.cleanup()
          }
        })
        .catch((e: any) => {
          setStatus('error')
          setMessage(e?.message || 'WebRTC failed')
        })
    }
    const onTransferStarted = ({ otp: roomOtp }: { otp: string }) => {
      if (roomOtp === otp) {
        setStatus('downloading')
        setMessage('Receiver is downloading…')
      }
    }
    const onTransferCompleted = ({ otp: roomOtp }: { otp: string }) => {
      if (roomOtp === otp) {
        setStatus('completed')
        setMessage('Transfer completed. File deleted from server.')
      }
    }
    const onTransferExpired = ({ otp: roomOtp }: { otp: string }) => {
      if (roomOtp === otp) {
        setStatus('expired')
        setMessage('Key expired. Please upload again.')
      }
    }
    const onOtpError = ({ otp: roomOtp, error }: { otp: string; error: string }) => {
      if (roomOtp !== otp) return
      setStatus('error')
      setMessage(error || 'OTP error')
    }

    socket.on('receiver_joined', onReceiverJoined)
    socket.on('receiver_ready', onReceiverReady)
    socket.on('transfer_started', onTransferStarted)
    socket.on('transfer_completed', onTransferCompleted)
    socket.on('transfer_expired', onTransferExpired)
    socket.on('otp_error', onOtpError)

    return () => {
      socket.off('receiver_joined', onReceiverJoined)
      socket.off('receiver_ready', onReceiverReady)
      socket.off('transfer_started', onTransferStarted)
      socket.off('transfer_completed', onTransferCompleted)
      socket.off('transfer_expired', onTransferExpired)
      socket.off('otp_error', onOtpError)
    }
  }, [socket, otp])

  const qrValue = otp ? `${window.location.origin}?otp=${otp}` : ''

  async function doUpload(selected: File) {
    senderStopRef.current?.()
    senderStopRef.current = null
    setFile(selected)
    setUploadPct(0)
    setStatus('uploading')
    setMessage('Uploading…')

    try {
      const resp = await api.post<UploadResponse>('/upload', {
        name: selected.name,
        size: selected.size,
        mimeType: selected.type || 'application/octet-stream',
      })

      setOtp(resp.data.otp)
      setExpiresAt(resp.data.expiresAt)
      setStatus('waiting')
      setMessage('Waiting for receiver…')
      socket.emit('register_sender', { otp: resp.data.otp })
    } catch (e: any) {
      setStatus('error')
      setMessage(e?.response?.data?.error || 'Upload failed')
    }
  }

  function onPickFile() {
    inputRef.current?.click()
  }

  function reset() {
    senderStopRef.current?.()
    senderStopRef.current = null
    setFile(null)
    setOtp('')
    setExpiresAt('')
    setUploadPct(0)
    setStatus('idle')
    setMessage('Drag & drop a file to generate a 6-digit key.')
  }

  return (
    <Card title="Send" subtitle="Upload a file. Share the 6-digit key with your receiver.">
      <div
        className="sp-glass-soft group relative flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-4 text-center transition hover:border-indigo-300"
        onClick={onPickFile}
        onDragOver={(e) => {
          e.preventDefault()
        }}
        onDrop={(e) => {
          e.preventDefault()
          const f = e.dataTransfer.files?.[0]
          if (f) void doUpload(f)
        }}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void doUpload(f)
          }}
        />

        <div className="grid h-16 w-16 place-items-center rounded-full bg-indigo-50 shadow-sm ring-1 ring-indigo-100">
          <svg
            className="h-8 w-8 text-indigo-600"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {file ? (
          <div className="mt-3 text-xs text-slate-600">
            <span className="font-semibold text-slate-900">{file.name}</span> · {prettyBytes(file.size)}
          </div>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {status === 'uploading' ? <ProgressBar value={uploadPct} label={`Uploading (${uploadPct}%)`} /> : null}

        {otp ? (
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your 6-digit key</div>
              <OtpBadge otp={otp} />
              <div className="flex items-center gap-2">
                <button
                  className="rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-cyan-500"
                  onClick={async () => {
                    await navigator.clipboard.writeText(otp)
                    setMessage('Copied key to clipboard.')
                  }}
                >
                  Copy key
                </button>
                <button
                  className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  onClick={reset}
                >
                  New upload
                </button>
              </div>
              {expiresAt ? (
                <div className="text-[11px] text-slate-500">
                  Expires at{' '}
                  <span className="font-semibold text-slate-700">{new Date(expiresAt).toLocaleTimeString()}</span>
                </div>
              ) : null}
            </div>

            <div className="sp-glass-soft flex items-center justify-center rounded-2xl p-3">
              {qrValue ? (
                <div className="space-y-2 text-center">
                  <div className="inline-block rounded-lg bg-white p-2">
                    <QRCodeCanvas value={qrValue} size={132} />
                  </div>
                  <div className="text-[11px] text-slate-500">QR opens receiver with prefilled key</div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {status !== 'idle' ? (
          <div className="sp-glass-soft rounded-2xl p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-slate-600">{message}</div>
              <div
                className={[
                  'rounded-full px-2 py-1 text-[11px] font-semibold',
                  status === 'waiting' ? 'bg-amber-100 text-amber-700' : '',
                  status === 'connected' ? 'bg-indigo-100 text-indigo-700' : '',
                  status === 'downloading' ? 'bg-cyan-100 text-cyan-700' : '',
                  status === 'completed' ? 'bg-emerald-100 text-emerald-700' : '',
                  status === 'expired' ? 'bg-rose-100 text-rose-700' : '',
                  status === 'error' ? 'bg-rose-100 text-rose-700' : '',
                  status === 'uploading' ? 'bg-slate-100 text-slate-700' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {status === 'uploading'
                  ? 'Uploading'
                  : status === 'waiting'
                    ? 'Waiting'
                    : status === 'connected'
                      ? 'Connected'
                      : status === 'downloading'
                        ? 'Downloading'
                        : status === 'completed'
                          ? 'Completed'
                          : status === 'expired'
                            ? 'Expired'
                            : 'Error'}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  )
}

