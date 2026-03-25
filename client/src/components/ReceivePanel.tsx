import { useEffect, useMemo, useRef, useState } from 'react'
import Card from './Card'
import ProgressBar from './ProgressBar'
import { api, type VerifyResponse } from '../lib/api'
import { getSocket } from '../lib/socket'
import { createReceiverSession } from '../lib/webrtc'

type Status = 'idle' | 'verifying' | 'ready' | 'downloading' | 'completed' | 'expired' | 'error'

function onlyDigits6(value: string) {
  return value.replace(/\D/g, '').slice(0, 6)
}

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

export default function ReceivePanel({ initialOtp }: { initialOtp?: string }) {
  const [otp, setOtp] = useState<string>(onlyDigits6(initialOtp || ''))
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string>('Enter the 6-digit key to fetch the file, then click download.')
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; mimeType: string } | null>(null)
  const [downloadPct, setDownloadPct] = useState<number>(0)
  const receiverStopRef = useRef<null | (() => void)>(null)
  const [verifiedOtp, setVerifiedOtp] = useState<string>('')

  const socket = useMemo(() => getSocket(), [])

  useEffect(() => {
    const onExpired = ({ otp: roomOtp }: { otp: string }) => {
      if (roomOtp === otp) {
        setStatus('expired')
        setMessage('Key expired.')
        setFileInfo(null)
        setVerifiedOtp('')
      }
    }
    const onOtpError = ({ otp: roomOtp, error }: { otp: string; error: string }) => {
      if (roomOtp !== otp) return
      setStatus('error')
      setMessage(error || 'OTP error')
      setFileInfo(null)
      setVerifiedOtp('')
      setDownloadPct(0)
    }
    socket.on('transfer_expired', onExpired)
    socket.on('otp_error', onOtpError)
    return () => {
      socket.off('transfer_expired', onExpired)
      socket.off('otp_error', onOtpError)
    }
  }, [socket, otp])

  async function verifyAndDownload() {
    const clean = onlyDigits6(otp)
    setOtp(clean)
    if (clean.length !== 6) {
      setStatus('error')
      setMessage('Please enter a 6-digit key.')
      return
    }

    setStatus('verifying')
    setMessage('Verifying…')
    setDownloadPct(0)

    try {
      receiverStopRef.current?.()
      receiverStopRef.current = null
      const verifyResp = await api.post<VerifyResponse>('/verify', { otp: clean })
      setFileInfo(verifyResp.data.file)
      socket.emit('register_receiver', { otp: clean })
      setVerifiedOtp(clean)
      setStatus('ready')
      setMessage('File ready. Click download to start.')
    } catch (e: any) {
      setStatus('error')
      setMessage(e?.response?.data?.error || 'Verify/download failed')
    }
  }

  function startDownload() {
    if (!verifiedOtp || verifiedOtp.length !== 6) return
    if (receiverStopRef.current) return

    setStatus('downloading')
    setMessage('Connecting…')
    setDownloadPct(0)

    const session = createReceiverSession({
      otp: verifiedOtp,
      socket,
      onStatus: (s) => setMessage(s),
      onProgress: (pct) => setDownloadPct(pct),
      onMeta: (m) => setFileInfo({ name: m.name, size: m.size, mimeType: m.mimeType }),
      onFile: (blob, meta) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = meta.name || 'download'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        setStatus('completed')
        setMessage('Completed')
        setDownloadPct(100)
      },
      onError: (e) => {
        setStatus('error')
        setMessage(e)
      },
    })

    session
      .start()
      .then((stop) => {
        receiverStopRef.current = () => {
          stop?.()
          session.cleanup()
        }
        // Tell sender we're ready and listening for the offer
        socket.emit('receiver_ready', { otp: verifiedOtp })
      })
      .catch((e: any) => {
        setStatus('error')
        setMessage(e?.message || 'WebRTC failed')
      })
  }

  return (
    <Card title="Receive" subtitle="Enter the key, then click download.">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            value={otp}
            inputMode="numeric"
            aria-label="OTP key"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-base tracking-[0.25em] text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 sm:text-lg sm:tracking-[0.35em]"
            onChange={(e) => {
              setVerifiedOtp('')
              setFileInfo(null)
              setOtp(onlyDigits6(e.target.value))
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void verifyAndDownload()
            }}
          />
          <button
            className="shrink-0 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50"
            disabled={status === 'verifying' || status === 'downloading'}
            onClick={() => void verifyAndDownload()}
          >
            {status === 'verifying' ? '…' : 'Find'}
          </button>
        </div>
        {fileInfo ? (
          <div className="sp-glass flex items-center justify-between gap-3 rounded-2xl p-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">{fileInfo.name}</div>
              <div className="mt-1 text-xs text-slate-600">{prettyBytes(fileInfo.size)}</div>
            </div>
            <button
              className="group inline-flex shrink-0 items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-slate-700 shadow-sm hover:bg-slate-200 disabled:opacity-50"
              aria-label="Download file"
              disabled={status !== 'ready'}
              onClick={startDownload}
              title={status === 'ready' ? 'Download' : 'Verify key first'}
            >
              <svg
                className="h-5 w-5 opacity-90 transition group-hover:opacity-100"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 3v10m0 0 4-4m-4 4-4-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ) : null}

        {status === 'downloading' ? (
          <ProgressBar value={downloadPct} label={`Downloading (${downloadPct}%)`} />
        ) : null}

        {status !== 'idle' ? (
          <div className="sp-glass-soft rounded-2xl p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-slate-600">{message}</div>
              <div
                className={[
                  'rounded-full px-2 py-1 text-[11px] font-semibold',
                  status === 'verifying' ? 'bg-amber-100 text-amber-700' : '',
                  status === 'ready' ? 'bg-indigo-100 text-indigo-700' : '',
                  status === 'downloading' ? 'bg-cyan-100 text-cyan-700' : '',
                  status === 'completed' ? 'bg-emerald-100 text-emerald-700' : '',
                  status === 'expired' ? 'bg-rose-100 text-rose-700' : '',
                  status === 'error' ? 'bg-rose-100 text-rose-700' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {status === 'verifying'
                  ? 'Verifying'
                  : status === 'ready'
                    ? 'Ready'
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

