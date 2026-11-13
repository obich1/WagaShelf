// The app's layout (header and navigation) and its pages (routes).
import { NavLink, Route, Routes, ScrollRestoration } from 'react-router-dom'

import { AccountMenu, SignInLink, signInEnabled, useSession } from './auth'
import { EmptyState } from './components/common'
import Discover from './pages/Discover'
import Home from './pages/Home'
import Shelf from './pages/Shelf'
import Shelves from './pages/Shelves'
import TitleDetail from './pages/TitleDetail'

function Header() {
  const { isLoaded, isSignedIn } = useSession()
  return (
    <header className="site-header">
      <NavLink to="/" className="brand" aria-label="WagaShelf home">
        <img src="./favicon.svg" alt="" width="28" height="28" />
        <span>WagaShelf</span>
      </NavLink>
      <nav className="main-nav" aria-label="Main">
        <NavLink to="/" end>
          <span aria-hidden="true">⌂</span> Home
        </NavLink>
        <NavLink to="/discover">
          <span aria-hidden="true">⌕</span> Discover
        </NavLink>
        <NavLink to="/shelves">
          <span aria-hidden="true">▤</span> My Shelves
        </NavLink>
      </nav>
      <div className="account">
        {isLoaded && (isSignedIn ? <AccountMenu /> : <SignInLink className="button button-small">Sign in</SignInLink>)}
      </div>
    </header>
  )
}

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      {!signInEnabled && (
        <p className="setup-banner">Sign-in isn't configured: add VITE_CLERK_PUBLISHABLE_KEY to enable shelves.</p>
      )}
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/title/:source/:sourceId" element={<TitleDetail />} />
          <Route path="/shelves" element={<Shelves />} />
          <Route path="/shelf/:mediaType" element={<Shelf />} />
          <Route path="*" element={<div className="page"><EmptyState title="Page not found" /></div>} />
        </Routes>
      </main>
      {/* New pages open at the top; Back returns to where you were on the previous page. */}
      <ScrollRestoration />
    </>
  )
}
