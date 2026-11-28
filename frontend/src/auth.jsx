// Everything the app needs from Clerk, in one place.
// Other files import from here instead of from Clerk directly, so the rest of the app
// doesn't depend on which sign-in provider WagaShelf uses.
import { ClerkProvider, SignInButton, UserButton, useAuth, useUser } from '@clerk/react'

import { CLERK_PUBLISHABLE_KEY } from './config'
import { inAppPath } from './lib/clerkRouting'
import { useTheme } from './theme'

export const signInEnabled = Boolean(CLERK_PUBLISHABLE_KEY)

// Clerk's sign-in screens, styled to match WagaShelf's colours. Clerk wants plain colour values,
// so these repeat the CSS variables in index.css for each theme.
const colours = {
  dark: {
    colorPrimary: '#e0a458',
    colorBackground: '#241c18',
    colorText: '#f3e9dc',
    colorTextSecondary: '#bfae9c',
    colorInputBackground: '#1b1512',
    colorInputText: '#f3e9dc',
  },
  light: {
    colorPrimary: '#945020',
    colorBackground: '#f7efe0',
    colorText: '#2d221b',
    colorTextSecondary: '#6b5a4f',
    colorInputBackground: '#ece0ca',
    colorInputText: '#2d221b',
  },
}

const appearanceFor = (theme) => ({
  variables: { ...colours[theme], borderRadius: '10px', fontFamily: 'Inter, system-ui, sans-serif' },
})

// Where to go after signing out: WagaShelf's home page, as a full address.
// Clerk resolves relative addresses like "./" from the site's root, not from the app's folder.
// On GitHub Pages, where the app lived in /WagaShelf/, that led to a 404 page. A full address
// leaves nothing to resolve, and working it out from the current page means it's right on any host.
const homeUrl = new URL('./', window.location.href).href

// `navigate(path, { replace })` moves around the app through its router. Clerk uses it, instead of
// setting the browser's address, after signing in or out (see lib/clerkRouting.js for why, #97).
export function AuthProvider({ children, navigate }) {
  const { theme } = useTheme()
  if (!signInEnabled) return children
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={appearanceFor(theme)}
      afterSignOutUrl={homeUrl}
      routerPush={(to) => navigate(inAppPath(to))}
      routerReplace={(to) => navigate(inAppPath(to), { replace: true })}
    >
      {children}
    </ClerkProvider>
  )
}

const signedOutSession = { isLoaded: true, isSignedIn: false, userName: null, getToken: async () => null }

// signInEnabled never changes while the app runs, so calling the Clerk hooks conditionally is safe.
export function useSession() {
  if (!signInEnabled) return signedOutSession
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { isLoaded, isSignedIn, getToken } = useAuth()
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { user } = useUser()
  return { isLoaded, isSignedIn: Boolean(isSignedIn), userName: user?.username || user?.firstName || null, getToken }
}

export function SignInLink({ children = 'Sign in', className = 'button', ...buttonProps }) {
  if (!signInEnabled) {
    return (
      <button className={className} disabled title="Sign-in isn't configured yet" {...buttonProps}>
        {children}
      </button>
    )
  }
  return (
    <SignInButton mode="modal">
      <button className={className} {...buttonProps}>
        {children}
      </button>
    </SignInButton>
  )
}

export function AccountMenu() {
  return signInEnabled ? <UserButton /> : null
}
