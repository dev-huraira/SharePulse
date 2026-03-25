import type { ReactNode } from 'react'

export default function SimplePage({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="sp-glass relative overflow-hidden rounded-3xl p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-200/60 to-cyan-200/50 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-gradient-to-br from-cyan-200/50 to-indigo-200/60 blur-2xl" />

        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500" />
            SharePulse Docs
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            <span className="sp-gradient-text">{title}</span>
          </h1>
        </div>

        <div className="sp-policy-content sp-stagger prose prose-slate mt-6 max-w-none prose-a:text-indigo-600 hover:prose-a:text-indigo-500">
          {children}
        </div>
      </div>
    </main>
  )
}

