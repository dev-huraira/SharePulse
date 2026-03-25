import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="sp-animated-bg min-h-full">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  )
}

