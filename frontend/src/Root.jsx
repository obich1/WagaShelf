// The whole app with everything it needs around it: sign-in, the shared library, and the router.
// main.jsx renders this into the page; the render test (App.test.jsx) renders the very same tree,
// so the test checks what users actually get.
import { StrictMode } from 'react'
import { RouterProvider, createHashRouter } from 'react-router-dom'

import App from './App'
import { AuthProvider } from './auth'
import { LibraryProvider } from './library/LibraryContext'

// The router uses "hash" URLs: the page lives in the part after "#", e.g. /#/discover.
// They started on GitHub Pages, which only serves real files, so they avoided 404 errors when
// refreshing a page. Vercel could serve clean URLs (/discover) with a rewrite rule; that's a
// separate change for later (see docs/decisions/010-host-the-frontend-on-vercel.md).
// createHashRouter (a "data router") instead of <HashRouter> so that <ScrollRestoration> in App works.
// Every path goes to App, which picks the page with its own <Routes>.
const router = createHashRouter([{ path: '*', element: <App /> }])

export default function Root() {
  return (
    <StrictMode>
      <AuthProvider>
        <LibraryProvider>
          <RouterProvider router={router} />
        </LibraryProvider>
      </AuthProvider>
    </StrictMode>
  )
}
