# Agent Rules

Rules for any AI agent working in this codebase.

---

## Stack
- **Next.js App Router** — read `node_modules/next/dist/docs/` before writing code; APIs change between versions
- **React** — functional components only
- **TypeScript** — strict mode, no `any` unless unavoidable and commented
- **Tailwind CSS** — utility-first, use design tokens below, no inline styles

---

## Component structure — Atomic Design
```
components/
  atoms/       — Button, Input, Spinner, Icon         (no dependencies on other components)
  molecules/   — MetaItem, SectionLabel, FormField    (atoms combined, no business logic)
  organisms/   — RecipeForm                           (full sections, can hold logic)
```

Default to **Server Components**. Add `"use client"` only at the leaf level when you need browser APIs, event handlers, or state.

Every interactive component needs a loading state and an error state.

---

## Design tokens
Never hardcode colors or fonts — use these tokens. They are configured in `app/globals.css` under `@theme inline` and available as Tailwind classes (`text-dark-green`, `bg-burnt-orange`, etc.).

| Token | Value | Usage |
|---|---|---|
| `dark-green` | `#3a4e48` | Primary brand, headings, buttons |
| `light-green` | `#cdd9c5` | Accents, highlights |
| `burnt-orange` | `#a5654e` | Labels, eyebrows, section headers |
| `background` | `#fbfbf6` | Page background |
| `image-background` | `#f1f0eb` | Image placeholders |
| `headlines` | `#3a3836` | UI headings |
| `copy` | `#5c5855` | Body text |
| `borders` | `#e1dbd4` | Dividers, input borders |

| Token | Value | Usage |
|---|---|---|
| `font-serif` | Libre Baskerville | Titles, pull quotes, step numbers |
| `font-sans` | Plus Jakarta Sans | Everything else |

---

## Accessibility
- Semantic HTML: one `<h1>` per page, logical heading hierarchy, `<main>` / `<nav>` / `<section>`
- Every `<img>` needs a meaningful `alt` (empty string only for decorative)
- Interactive elements must be keyboard-navigable with visible focus states
- WCAG AA contrast: 4.5:1 for text, 3:1 for UI components
- Form inputs must have associated `<label>` elements

---

## Security
- Validate and sanitize all user input before using it in URLs, HTML, or file paths
- API routes return 400 for bad input — never expose stack traces in responses
- Strip tracking params (UTM, fbclid, etc.) from any URL stored or displayed

---

## Before marking anything done
1. Spawn a sub-agent to review the diff for bugs, security issues, and a11y violations
2. Run `npx tsc --noEmit` — must pass with zero errors
3. Verify the feature works in the browser — type checks are not enough
4. Test at a narrow viewport (≤375px)

---

## Code style
- Comments only for *why*, never *what*
- No `console.log` in committed code
- Commit messages: imperative, lowercase, specific — `fix meta row centering` not `fix bug`
