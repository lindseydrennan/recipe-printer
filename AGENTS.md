# Agent Rules

## Always read first
This project runs Next.js 16+ with the App Router. APIs and conventions differ
from older versions. Before writing any code, read the relevant guide in
`node_modules/next/dist/docs/`. Heed all deprecation notices.

---

## Stack — non-negotiable
- **Next.js App Router** — file-based routing, layouts, server components
- **React** — functional components only, no class components
- **TypeScript** — strict mode, no `any` unless unavoidable and commented
- **Tailwind CSS** — utility-first, use design tokens (see below), no inline styles

---

## Design tokens
Always use these values. Never hardcode colors or fonts outside of this list.

**Colors**
```
dark-green:       #3a4e48   (primary brand, headings, buttons)
light-green:      #cdd9c5   (accents, meta bars)
burnt-orange:     #bc7f6a   (labels, eyebrows, section headers)
background:       #fbfbf6   (page background)
image-background: #f1f0eb   (image placeholders)
headlines:        #3a3836   (UI headings)
copy:             #6d6966   (body text)
borders:          #e1dbd4   (dividers, input borders)
```

**Typography**
```
font-serif:  Libre Baskerville — titles, pull quotes, step numbers
font-sans:   Plus Jakarta Sans — everything else
```

**Tailwind custom colors are configured in globals.css under `@theme inline`.
Reference them as `text-dark-green`, `bg-burnt-orange`, `border-borders`, etc.**

---

## Component rules
- Default to **Server Components**. Add `"use client"` only when you need
  browser APIs, event handlers, or React state.
- Keep client components small and at the leaf level.
- Every interactive component needs a **loading state** and an **error state**.
- Never leave empty catch blocks. Surface errors to the user.

---

## Accessibility (a11y)
- Use semantic HTML: `<main>`, `<nav>`, `<section>`, `<article>`, `<button>`,
  proper heading hierarchy (one `<h1>` per page).
- Every `<img>` needs a meaningful `alt` attribute (empty string only for
  decorative images).
- Interactive elements must be keyboard-navigable and have visible focus states.
- Color contrast must meet WCAG AA (4.5:1 for text, 3:1 for UI components).
- Form inputs must have associated `<label>` elements.

---

## Security
- Validate and sanitize all user input before using it in URLs, HTML, or
  file paths.
- API routes must validate request bodies before processing — return 400 for
  bad input, not 500.
- Never expose internal error messages or stack traces in API responses.
- Strip tracking parameters (UTM, fbclid, etc.) from any URL stored or displayed.
- Do not log user-submitted URLs or recipe content to the console in production.

---

## Quality checks — run before reporting done
1. **Sub-agent review** — spawn a second agent to audit the diff for bugs,
   security issues, and a11y violations before calling a task complete.
2. **TypeScript** — `npx tsc --noEmit` must pass with zero errors.
3. **Visual check** — if the change affects UI, start the dev server and verify
   the golden path works in the browser. Do not rely on type checks alone.
4. **Mobile** — test at a narrow viewport. Layouts must not break below 375px.

---

## Code style
- No comments that describe *what* the code does — only *why* if it's non-obvious.
- No `console.log` left in committed code.
- Prefer editing existing files over creating new ones.
- One responsibility per file. Co-locate related logic.
- Commit messages: imperative mood, lowercase, specific ("fix meta row centering"
  not "fix bug").
