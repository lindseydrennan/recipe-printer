# Agent Rules — Recipe Printer

Global rules apply: see `~/.claude/CLAUDE.md`.
Project-specific additions below.

---

## Next.js version
This project runs Next.js 16+ with the App Router. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Heed all deprecation notices.

---

## Design tokens
Always use these values. Never hardcode colors or fonts outside of this list.

**Colors**
```
dark-green:       #3a4e48   (primary brand, headings, buttons)
light-green:      #cdd9c5   (accents, highlights)
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

Tokens are configured in `app/globals.css` under `@theme inline`.
Reference them as `text-dark-green`, `bg-burnt-orange`, `border-borders`, etc.

---

## Component structure for this project
```
components/
  atoms/       — Button, Input, Spinner, Icon
  molecules/   — MetaItem, SectionLabel, FormField
  organisms/   — RecipeForm
```
