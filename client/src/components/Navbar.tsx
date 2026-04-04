import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

function Item({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'sp-nav-link rounded-md px-3 py-2 text-sm font-medium transition',
          isActive
            ? 'sp-nav-link-active bg-slate-100 text-slate-900 shadow-sm'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
        ].join(' ')
      }
    >
      {label}
    </NavLink>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-sm">
            <span className="text-sm font-black">S</span>
          </div>
          <div className="text-sm font-extrabold tracking-tight text-slate-900">SharePulse</div>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <Item to="/" label="Transfer" />
          <Item to="/developer" label="Developer" />
          <Item to="/about" label="About" />
          <Item to="/contact" label="Contact" />
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg bg-slate-100 p-2 text-slate-900 shadow-sm hover:bg-slate-200 sm:hidden"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div
        className={[
          'sm:hidden overflow-hidden transition-all duration-300 ease-out',
          open ? 'max-h-80 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1',
        ].join(' ')}
      >
        <div className="mx-auto max-w-6xl px-4 pb-4">
          <div className="sp-glass rounded-2xl p-2">
            <div
              className="flex flex-col"
              onClick={(e) => {
                const target = e.target as HTMLElement
                if (target.closest('a')) setOpen(false)
              }}
            >
              <Item to="/" label="Transfer" />
              <Item to="/developer" label="Developer" />
              <Item to="/about" label="About" />
              <Item to="/contact" label="Contact" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

