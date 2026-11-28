// Clerk needs to move around the app after signing in or out (#97).
//
// Left alone, Clerk does it by setting the browser's address and waiting for the page to load.
// With WagaShelf's hash addresses (/#/shelves) that never happens when you're already on that
// page, so Clerk waits forever and the app never learns you signed in until you reload.
// So Clerk is told to go through the app's router instead (routerPush / routerReplace in auth.jsx).

// Clerk hands over addresses the way the browser shows them ("/#/shelves?q=dune"), but the router
// wants only what comes after the "#" ("/shelves?q=dune"). With no "#" the address is already a
// path, and "/" (the home page) is what an empty hash means.
export function inAppPath(to) {
  const hash = to.indexOf('#')
  if (hash === -1) return to || '/'
  return to.slice(hash + 1) || '/'
}
