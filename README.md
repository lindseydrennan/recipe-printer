# Recipe Printer

Paste any recipe URL. Get a clean, print-ready PDF.

Most recipe websites are a nightmare to print — ads, popups, and twenty paragraphs of backstory before the ingredients. Recipe Printer scrapes the actual recipe and formats it into a single 8.5×11 card you can print and keep.

## How it works

Drop a URL into the input field and hit **Get PDF**. The app fetches the page using a headless browser (so it works even on JavaScript-heavy sites), extracts the recipe data, and renders it into a formatted PDF using your design system — Libre Baskerville for the title, Plus Jakarta Sans for everything else, with clean dividers and a two-column layout for ingredients and directions.

The scraper pulls from JSON-LD structured data when available and falls back to Elementor widget markup, recipe plugin class conventions, and measurement-based heuristics for sites that don't use structured data. Oven temperature and cooking method are detected automatically to label the time correctly as either Bake Time or Cook Time.

## Stack

- **Next.js** (App Router)
- **Tailwind CSS**
- **Puppeteer** — handles both fetching (bypasses bot detection) and PDF generation
- **Cheerio** — HTML parsing for recipe extraction

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
