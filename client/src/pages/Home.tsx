import { useEffect, useMemo, useState } from 'react'
import SendPanel from '../components/SendPanel'
import ReceivePanel from '../components/ReceivePanel'
import { getSocket } from '../lib/socket'

function useQueryOtp() {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('otp') || undefined
  }, [])
}

export default function Home() {
  const initialOtp = useQueryOtp()
  const socket = useMemo(() => getSocket(), [])
  const [online, setOnline] = useState<boolean>(socket.connected)

  useEffect(() => {
    const onConnect = () => setOnline(true)
    const onDisconnect = () => setOnline(false)
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [socket])

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <div className="mx-auto w-full max-w-md space-y-4 lg:mx-0 lg:max-w-none">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">Transfer</div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className={online ? 'h-2 w-2 rounded-full bg-emerald-500' : 'h-2 w-2 rounded-full bg-rose-500'} />
              {online ? 'Online' : 'Offline'}
            </div>
          </div>

          <SendPanel />
          <ReceivePanel initialOtp={initialOtp} />
        </div>

        <div className="hidden lg:block">
          <div className="sp-glass h-full rounded-3xl p-10">
            <div className="max-w-md">
              <div className="text-3xl font-extrabold tracking-tight text-slate-900">
                Fast and friendly <span className="sp-gradient-text">file sharing</span>
              </div>
              <div className="mt-3 text-sm leading-6 text-slate-600">
                Upload a file to get a 6-digit one-time key. Share it with your receiver and download securely.
              </div>
              <div className="sp-hero-illustration mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-50 to-cyan-50 p-4">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sender</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">project-demo.zip</div>
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Receiver</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">Download ready</div>
                </div>
                <div className="absolute left-[34%] right-[34%] top-1/2 -translate-y-1/2 border-t-2 border-dashed border-indigo-300" />
                <div className="sp-hero-dot" />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 text-sm text-slate-700">
                <div className="sp-glass-soft rounded-2xl px-4 py-3">
                  <div className="font-semibold text-slate-900">One-time keys</div>
                  <div className="mt-1 text-xs text-slate-600">Keys expire after 10 minutes or after first download.</div>
                </div>
                <div className="sp-glass-soft rounded-2xl px-4 py-3">
                  <div className="font-semibold text-slate-900">Auto-cleanup</div>
                  <div className="mt-1 text-xs text-slate-600">Files are deleted after download or expiry.</div>
                </div>
                <div className="sp-glass-soft rounded-2xl px-4 py-3">
                  <div className="font-semibold text-slate-900">Real-time status</div>
                  <div className="mt-1 text-xs text-slate-600">Sender sees when receiver connects and downloads.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

