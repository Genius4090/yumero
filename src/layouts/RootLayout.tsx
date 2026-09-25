import { Outlet } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { Footer, Header } from '../modules'

const RootLayout = () => {
  return (
    /* bottom padding below lg keeps the footer clear of the floating bottom navigation bar (64px bar + 12px gap + safe area) */
    <div className="flex min-h-screen flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}

export default RootLayout
