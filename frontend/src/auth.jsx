// Everything the app needs from Clerk, in one place.
// Other files import from here instead of from Clerk directly, so the rest of the app
// doesn't depend on which sign-in provider WagaShelf uses.
import { ClerkProvider, SignInButton, UserButton, useAuth, useUser } from '@clerk/react'

import { CLERK_PUBLISHABLE_KEY } from './config'

export const signInEnabled = Boolean(CLERK_PUBLISHABLE_KEY)

// Clerk's sign-in screens, styled to match WagaShelf's colours.
const appearance = {
  variables: {
    colorPrimary: '#e0a458',
    colorBackground: '#241c18',
    colorText: '#f3e9dc',
    colorTextSecondary: '#bfae9c',
    colorInputBackground: '#1b1512',
    colorInputText: '#f3e9dc',
    borderRadius: '10px',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
}

export function AuthProvider({ children }) {
  if (!signInEnabled) return children
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} appearance={appearance} afterSignOutUrl="./">
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
  return { isLoaded, isSignedIn: Boolean(isSignedIn), userName: user?.firstName || user?.username || null, getToken }
}

export function SignInLink({ children = 'Sign in', className = 'button' }) {
  if (!signInEnabled) {
    return (
      <button className={className} disabled title="Sign-in isn't configured yet">
        {children}
      </button>
    )
  }
  return (
    <SignInButton mode="modal">
      <button className={className}>{children}</button>
    </SignInButton>
  )
}

export function AccountMenu() {
  return signInEnabled ? <UserButton /> : null
}
