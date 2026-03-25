import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:items-center sm:text-left">
          <div className="text-xs text-slate-500">
            © {new Date().getFullYear()} SharePulse. 
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-xs sm:justify-start">
            <Link className="sp-footer-link text-slate-500 hover:text-slate-900" to="/privacy">
              Privacy
            </Link>
            <Link className="sp-footer-link text-slate-500 hover:text-slate-900" to="/terms">
              Terms
            </Link>
            <a className="sp-footer-link text-slate-500 hover:text-slate-900" href="mailto:sharepulse.support@gmail.com">
              sharepulse.support@gmail.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

