# 011. Themes are sets of CSS variables

- **Date:** 2026-11-24
- **Status:** Accepted

## Context

WagaShelf only had the dark "Cozy" look. A tester asked for a lighter option (#79), and more
themes (such as Matcha) are likely later. The app already defined its colours once as CSS
variables in `index.css`, but some colours were still written directly into rules (the header,
the media badges, shadows) and Clerk's sign-in screens had their own hard-coded colours.

## Options considered

1. **A second stylesheet per theme.** Simple to read, but every rule is repeated, and the copies drift apart.
2. **CSS variables with a `data-theme` attribute on `<html>`.** One set of rules; a theme is only
   a block of values. Switching is one attribute, with no re-render of components.
3. **A CSS-in-JS or theming library.** Powerful, but a new dependency and a rewrite of the styles for what is a small need.
4. **Only follow the device (`prefers-color-scheme`), with no switch.** Least code, but people can't choose the opposite of their device, and the tester wanted a switch.

## Decision

Option 2. The dark values stay as the default in `:root`; the light theme ("Cream") is
`:root[data-theme='light']`. Leftover hard-coded colours became variables first. `src/theme.jsx`
holds the person's choice (light, dark or "match my device"), sets `data-theme`, and saves the
choice in `localStorage`. Until a choice is made the app follows the device. A small inline script
in `index.html` applies the theme before the page paints, to avoid a flash of the wrong colours.
Clerk's colours are chosen from the current theme in `auth.jsx`, because Clerk wants plain values.

## Consequences

- A new theme is a block of variable values, an entry in `THEMES`, and a set of Clerk colours.
- The inline script repeats the rules in `theme.jsx`; the two must be changed together.
- The choice is saved per browser. Saving it to the account needs a change to the `users` table,
  planned after Alembic (#40).
- The web app manifest's `theme_color` is fixed (dark). It only affects the install splash screen.
- Light-theme text colours were checked for contrast (WCAG AA, 4.5:1). Cream's accent from the
  prototype was darkened for that reason.
