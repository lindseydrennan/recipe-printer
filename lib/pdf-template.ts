import type { Recipe } from "./scraper";

/** Remove UTM and tracking params from source URLs */
function cleanUrl(url: string): string {
  try {
    const u = new URL(url);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
     "fbclid", "gclid", "ref", "source", "mc_cid", "mc_eid"].forEach((p) =>
      u.searchParams.delete(p)
    );
    return u.toString().replace(/\?$/, "");
  } catch {
    return url;
  }
}

/** Infer a category from the recipe name and description */
function inferCategory(recipe: Recipe): string {
  const text = `${recipe.name} ${recipe.description}`.toLowerCase();
  if (/cake|cookie|brownie|pie|pudding|ice cream|fudge|tart|cupcake|cheesecake|macaron|donut|gelato|sorbet/.test(text)) return "Dessert";
  if (/pancake|waffle|omelette|frittata|french toast|oatmeal|granola|breakfast|brunch|scramble/.test(text)) return "Breakfast";
  if (/smoothie|juice|cocktail|mocktail|lemonade|iced tea|milkshake|spritz|margarita|mojito|drink|latte|frappe/.test(text)) return "Drink";
  if (/dip|bruschetta|crostini|spring roll|deviled egg|finger food|appetizer|starter|skewer|crostata/.test(text)) return "Appetizer";
  if (/\bsalad\b|coleslaw|pilaf|side dish|roasted (vegetable|potato|carrot|beet)|mashed potato|\brice\b|\bquinoa\b/.test(text)) return "Side";
  return "Entree";
}

/** Decode HTML entities from scraped content before re-encoding for HTML output */
function safeText(str: string): string {
  const decoded = str
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
  // Re-encode only the chars that matter in HTML text content
  return decoded.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const clockIcon = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="6" r="5" stroke="#6d6966" stroke-width="1.1"/><path d="M6 3.5V6L7.5 7.2" stroke="#6d6966" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const heartIcon = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 10C6 10 1 6.5 1 3.8C1 2.25 2.25 1 3.8 1C4.7 1 5.6 1.45 6 2.3C6.4 1.45 7.3 1 8.2 1C9.75 1 11 2.25 11 3.8C11 6.5 6 10 6 10Z" stroke="#6d6966" stroke-width="1.1"/></svg>`;
const servingIcon = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="4" r="2.2" stroke="#6d6966" stroke-width="1.1"/><path d="M1.5 10.5C1.5 8.01 3.57 6 6 6C8.43 6 10.5 8.01 10.5 10.5" stroke="#6d6966" stroke-width="1.1" stroke-linecap="round"/></svg>`;
const tempIcon = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 1L7.2 4.2H10.5L7.9 6.3L8.9 9.5L6 7.6L3.1 9.5L4.1 6.3L1.5 4.2H4.8L6 1Z" stroke="#6d6966" stroke-width="1.1" stroke-linejoin="round"/></svg>`;

export function buildRecipeHTML(recipe: Recipe): string {
  const category = inferCategory(recipe);
  const sourceUrl = cleanUrl(recipe.source);
  const timeLabel = recipe.cookingMethod === "bake" ? "Bake Time" : "Cook Time";

  const metaItems: string[] = [];
  if (recipe.cookTime)  metaItems.push(`<span class="meta-item">${clockIcon}<span>${timeLabel}: ${recipe.cookTime}</span></span>`);
  if (recipe.prepTime)  metaItems.push(`<span class="meta-item">${heartIcon}<span>Prep Time: ${recipe.prepTime}</span></span>`);
  if (recipe.ovenTemp)  metaItems.push(`<span class="meta-item">${tempIcon}<span>${recipe.ovenTemp}</span></span>`);
  if (recipe.servings && !recipe.ovenTemp) metaItems.push(`<span class="meta-item">${servingIcon}<span>Serves: ${recipe.servings}</span></span>`);

  const totalInstructionChars = recipe.instructions.reduce((sum, s) => sum + s.length, 0);
  const totalIngredientChars = recipe.ingredients.reduce((sum, s) => sum + s.length, 0);
  const contentScore = totalInstructionChars + totalIngredientChars * 0.5;

  const density: "normal" | "compact" | "dense" =
    contentScore > 3000 ? "dense" :
    contentScore > 1800 ? "compact" :
    "normal";

  const stepFontSize =      { normal: "9.5pt", compact: "8.5pt", dense: "7.5pt" }[density];
  const stepLineHeight =    { normal: "13pt",  compact: "11.5pt", dense: "9.5pt" }[density];
  const stepMargin =        { normal: "14pt",  compact: "10pt",  dense: "5pt" }[density];
  const stepNumSize =       { normal: "16pt",  compact: "13pt",  dense: "10pt" }[density];
  const ingredientFontSize =    { normal: "9pt", compact: "8pt", dense: "7.5pt" }[density];
  const ingredientLineHeight =  { normal: "13pt", compact: "11pt", dense: "9.5pt" }[density];
  const ingredientPadding =     { normal: "4pt", compact: "3pt", dense: "2pt" }[density];

  const ingredientItems = recipe.ingredients
    .map((i) => `<li>${safeText(i)}</li>`)
    .join("");

  const instructionItems = recipe.instructions
    .map(
      (step, i) =>
        `<div class="step"><span class="step-num">${i + 1}</span><span class="step-text">${safeText(step)}</span></div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    /* All dimensions in pt (1pt = 1px in 72dpi Figma = 1/72in in print) */
    @page { size: 8.5in 11in; margin: 0; }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #ffffff;
      color: #6d6966;
      width: 612pt;
      height: 792pt;
      position: relative;
      overflow: hidden;
    }

    /* ── Header ────────────────────────────── */
    .header {
      position: absolute;
      left: 23pt;
      top: 22pt;
      width: 568pt;
    }
    .eyebrow {
      font-size: 10pt;
      font-weight: 600;
      letter-spacing: 1pt;
      text-transform: uppercase;
      color: #bc7f6a;
      line-height: 16pt;
      margin-bottom: 2pt;
    }
    .title {
      font-family: 'Libre Baskerville', serif;
      font-size: 24pt;
      font-weight: 400;
      color: #3a4e48;
      letter-spacing: -0.36pt;
      line-height: 32pt;
      margin-bottom: 6pt;
    }
    .description {
      font-size: 10pt;
      font-weight: 400;
      color: #6d6966;
      line-height: 14pt;
      max-width: 420pt;
    }

    /* ── Dividers ──────────────────────────── */
    .divider {
      position: absolute;
      left: 0;
      width: 612pt;
      height: 0.75pt;
      background: #e1dbd4;
    }

    /* ── Meta row ──────────────────────────── */
    .meta-section {
      position: absolute;
      left: 0;
      top: 136pt;
      width: 612pt;
      height: 41pt;
      display: flex;
      align-items: center;
      padding-left: 23pt;
    }
    .meta {
      display: flex;
      align-items: center;
      gap: 28pt;
    }
    .meta-item {
      display: inline-flex;
      align-items: center;
      gap: 6pt;
      font-size: 10pt;
      font-weight: 400;
      color: #6d6966;
      white-space: nowrap;
    }
    .meta-item svg { flex-shrink: 0; }

    /* ── Section labels ────────────────────── */
    .section-label {
      font-size: 10pt;
      font-weight: 600;
      letter-spacing: 1pt;
      text-transform: uppercase;
      color: #bc7f6a;
      line-height: 16pt;
      margin-bottom: 10pt;
    }

    /* ── Ingredients column ────────────────── */
    .ingredients-col {
      position: absolute;
      left: 23pt;
      top: 197pt;
      width: 167pt;
    }
    .ingredients-col ul {
      list-style: none;
      padding: 0;
    }
    .ingredients-col li {
      font-size: ${ingredientFontSize};
      line-height: ${ingredientLineHeight};
      color: #6d6966;
      padding: ${ingredientPadding} 0;
      border-bottom: 0.5pt solid rgba(225, 219, 212, 0.5);
    }
    .ingredients-col li:last-child { border-bottom: none; }

    /* ── Vertical divider ──────────────────── */
    .col-divider {
      position: absolute;
      left: 206pt;
      top: 177pt;
      width: 0.75pt;
      height: 576pt; /* 753 - 177 */
      background: #e1dbd4;
    }

    /* ── Directions column ─────────────────── */
    .directions-col {
      position: absolute;
      left: 222pt;
      top: 197pt;
      width: 369pt;
    }
    .step {
      display: flex;
      gap: 12pt;
      align-items: flex-start;
      margin-bottom: ${stepMargin};
    }
    .step-num {
      font-family: 'Libre Baskerville', serif;
      font-size: ${stepNumSize};
      font-weight: 400;
      color: #3a4e48;
      letter-spacing: -0.24pt;
      line-height: ${stepNumSize};
      min-width: 10pt;
      flex-shrink: 0;
    }
    .step-text {
      font-size: ${stepFontSize};
      font-weight: 400;
      color: #6d6966;
      line-height: ${stepLineHeight};
      padding-top: 1.5pt;
    }

    /* ── Footer ────────────────────────────── */
    .footer {
      position: absolute;
      left: 23pt;
      top: 763pt;
      width: 566pt;
      font-size: 8pt;
      color: #6d6966;
      line-height: 20pt;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <p class="eyebrow">${safeText(category)}</p>
    <p class="title">${safeText(recipe.name)}</p>
    ${recipe.description ? `<p class="description">${safeText(recipe.description)}</p>` : ""}
  </div>

  <!-- Divider 1 -->
  <div class="divider" style="top: 136pt"></div>

  <!-- Meta row — centered between the two dividers -->
  ${metaItems.length ? `<div class="meta-section"><div class="meta">${metaItems.join("")}</div></div>` : ""}

  <!-- Divider 2 -->
  <div class="divider" style="top: 177pt"></div>

  <!-- Ingredients -->
  <div class="ingredients-col">
    <p class="section-label">Ingredients</p>
    <ul>${ingredientItems}</ul>
  </div>

  <!-- Vertical divider -->
  <div class="col-divider"></div>

  <!-- Directions -->
  <div class="directions-col">
    <p class="section-label">Directions</p>
    ${instructionItems}
  </div>

  <!-- Divider 3 -->
  <div class="divider" style="top: 753pt"></div>

  <!-- Footer -->
  <div class="footer">source: ${safeText(sourceUrl)}</div>

</body>
</html>`;
}
