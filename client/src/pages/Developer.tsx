const DEVELOPER_EMAIL = 'sharepulse.support@gmail.com'
const DEVELOPER_PHONE_DISPLAY = '+92 332 687 1681'
const DEVELOPER_PHONE_TEL = '+923326871681'

const SKILLS = [
  {
    title: 'Frontend',
    items: ['React & TypeScript', 'Responsive UI / Tailwind CSS', 'SPA routing & state patterns'],
  },
  {
    title: 'Backend & APIs',
    items: ['RESTful services', 'Real-time WebSockets', 'Authentication-ready architecture'],
  },
  {
    title: 'Full stack',
    items: ['End-to-end product delivery', 'Performance & UX polish', 'Secure, maintainable code'],
  },
] as const

function gmailComposeUrl(to: string) {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to,
  })
  return `https://mail.google.com/mail/?${params.toString()}`
}

export default function Developer() {
  const gmailUrl = gmailComposeUrl(DEVELOPER_EMAIL)

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="sp-glass relative overflow-hidden rounded-3xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-200/60 to-cyan-200/50 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-gradient-to-br from-cyan-200/50 to-indigo-200/60 blur-2xl" />

        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-10 lg:p-10">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="relative">
              <div className="absolute -inset-1 rounded-[1.35rem] bg-gradient-to-br from-indigo-500/30 to-cyan-500/30 blur-sm" />
              <img
                src="/Huraira.jpg"
                alt="Muhammad Huraira"
                className="relative h-44 w-44 rounded-2xl border border-slate-200 object-cover object-top shadow-lg sm:h-52 sm:w-52"
                width={208}
                height={208}
              />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">Developer</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Muhammad <span className="sp-gradient-text">Huraira</span>
            </h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-600 lg:max-w-none">
              Full stack web developer focused on clean interfaces, solid architecture, and reliable delivery from idea to
              production.
            </p>
          </div>

          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500" />
              SharePulse · Built by
            </div>

            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Web development expertise</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              I design and build modern web applications with attention to usability, performance, and long-term
              maintainability—whether that is a polished product surface or the systems behind it.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SKILLS.map((block) => (
                <div
                  key={block.title}
                  className="sp-glass-soft rounded-2xl border border-slate-200/80 p-4 transition hover:border-indigo-200 hover:shadow-md"
                >
                  <div className="text-sm font-bold text-slate-900">{block.title}</div>
                  <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600">
                    {block.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-indigo-50/40 p-5 sm:p-6">
              <div className="text-sm font-bold text-slate-900">Get in touch</div>
              <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                Available for collaboration, freelance work, and technical discussions.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <a
                  href={`mailto:${DEVELOPER_EMAIL}`}
                  className="text-sm font-medium text-indigo-600 underline decoration-indigo-200 underline-offset-2 transition hover:text-indigo-500"
                >
                  {DEVELOPER_EMAIL}
                </a>
                <span className="hidden text-slate-300 sm:inline">·</span>
                <a
                  href={`tel:${DEVELOPER_PHONE_TEL}`}
                  className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
                >
                  {DEVELOPER_PHONE_DISPLAY}
                </a>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={gmailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-cyan-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964l5.818 4.364 5.818-4.364C21.69 2.28 24 3.434 24 5.457z" />
                  </svg>
                  Open in Gmail
                </a>
                <a
                  href={`tel:${DEVELOPER_PHONE_TEL}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Call
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
