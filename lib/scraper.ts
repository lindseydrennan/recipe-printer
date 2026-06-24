import { load } from "cheerio";
import fetch from "node-fetch";

export interface Recipe {
  name: string;
  description: string;
  prepTime: string | null;
  cookTime: string | null;
  totalTime: string | null;
  servings: string | null;
  ovenTemp: string | null;
  cookingMethod: "bake" | "cook";
  ingredients: string[];
  instructions: string[];
  source: string;
}

function extractOvenTemp(text: string): string | null {
  // Match patterns like "350°F", "325 degrees F", "180°C", "preheat to 400F"
  const match =
    text.match(/\bpreheat[^.]{0,40}?(\d{2,3})\s*°?\s*([FC])\b/i) ||
    text.match(/\b(\d{2,3})\s*°\s*([FC])\b/i) ||
    text.match(/\b(\d{2,3})\s*degrees?\s*([FC])\b/i);
  if (!match) return null;
  const temp = match[1];
  const unit = match[2].toUpperCase();
  return `${temp}°${unit}`;
}

function detectCookingMethod(text: string): "bake" | "cook" {
  return /\b(bake[sd]?|baking|roast(ed|ing)?|broil(ed|ing)?|oven|preheat)\b/i.test(text)
    ? "bake"
    : "cook";
}

function formatDuration(iso?: string): string | null {
  if (!iso) return null;
  const h = iso.match(/(\d+)H/)?.[1];
  const m = iso.match(/(\d+)M/)?.[1];
  const parts: string[] = [];
  if (h) parts.push(`${h} hr`);
  if (m) parts.push(`${m} min`);
  return parts.join(" ") || null;
}

function extractInstructions(raw: unknown): string[] {
  if (!raw) return [];
  if (typeof raw === "string") return [raw.trim()];
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (typeof item === "string") return [item.trim()];
    if (item?.["@type"] === "HowToSection") return extractInstructions(item.itemListElement);
    const text = item?.text?.trim() || item?.name?.trim() || "";
    return text ? [text] : [];
  });
}

/** Parse a recipe from raw HTML + the source URL. No network calls. */
export function parseRecipeFromHTML(html: string, url: string): Recipe {
  const $ = load(html);

  // Try JSON-LD structured data first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let jsonLd: any = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (jsonLd) return;
    try {
      const data = JSON.parse($(el).html() ?? "");
      const candidates = Array.isArray(data)
        ? data
        : [data, ...(data["@graph"] ?? [])];
      for (const item of candidates) {
        if (
          item["@type"] === "Recipe" ||
          (Array.isArray(item["@type"]) && item["@type"].includes("Recipe"))
        ) {
          jsonLd = item;
          break;
        }
      }
    } catch {
      // malformed JSON-LD — skip
    }
  });

  if (jsonLd) {
    const allText = [
      jsonLd.description ?? "",
      ...(jsonLd.recipeIngredient ?? []),
      ...extractInstructions(jsonLd.recipeInstructions),
    ].join(" ");
    const ovenTemp = extractOvenTemp(allText);
    const cookingMethod = detectCookingMethod(
      [jsonLd.cookingMethod ?? "", allText].join(" ")
    );
    return {
      name: jsonLd.name || "Untitled Recipe",
      description: jsonLd.description || "",
      prepTime: formatDuration(jsonLd.prepTime),
      cookTime: formatDuration(jsonLd.cookTime),
      totalTime: formatDuration(jsonLd.totalTime),
      servings: jsonLd.recipeYield
        ? Array.isArray(jsonLd.recipeYield)
          ? String(jsonLd.recipeYield[0])
          : String(jsonLd.recipeYield)
        : null,
      ovenTemp,
      cookingMethod,
      ingredients: (jsonLd.recipeIngredient ?? []).map((i: string) => i.trim()),
      instructions: extractInstructions(jsonLd.recipeInstructions),
      source: url,
    };
  }

  // HTML fallback — try several common recipe markup patterns
  const name =
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    "Untitled Recipe";

  let ingredients: string[] = [];
  let instructions: string[] = [];
  let description = "";
  let prepTime: string | null = null;
  let cookTime: string | null = null;
  let totalTime: string | null = null;
  let servings: string | null = null;

  // Pattern 1: class-name conventions (Tasty Recipes, WP Recipe Maker, etc.)
  $("[class*='ingredient'] li, [class*='Ingredient'] li").each((_, el) => {
    const text = $(el).text().trim();
    if (text) ingredients.push(text);
  });
  $("[class*='instruction'] li, [class*='step'] li, [class*='direction'] li").each(
    (_, el) => {
      const text = $(el).text().trim();
      if (text) instructions.push(text);
    }
  );

  // Pattern 2: Elementor — post-content widget for description, text-editor for recipe data
  if (!ingredients.length && !instructions.length) {
    // Description from the Elementor post content widget
    const postContent = $("[data-widget_type='theme-post-content.default'] p").first().text().trim();
    if (postContent) description = postContent;

    $("[data-widget_type='text-editor.default'] ul li").each((_, el) => {
      const text = $(el).text().trim();
      if (text) ingredients.push(text);
    });
    $("[data-widget_type='text-editor.default'] ol li").each((_, el) => {
      const text = $(el).text().trim();
      if (text) instructions.push(text);
    });
  }

  // Pattern 3: generic ul/ol heuristic — last resort for hand-built pages
  if (!ingredients.length && !instructions.length) {
    const measurementRe = /\d+\s*(tbsp|tsp|cup|oz|lb|g\b|kg|ml|l\b|pinch|clove)/i;
    $("ul li").each((_, el) => {
      const text = $(el).text().trim();
      if (text && measurementRe.test(text)) ingredients.push(text);
    });
    if (ingredients.length) {
      $("ol li").each((_, el) => {
        const text = $(el).text().trim();
        if (text) instructions.push(text);
      });
    }
  }

  // Extract timing from visible page text — works across most recipe sites
  // that display "Prep Time: X" style labels even without structured data
  const fullText = $("body").text();
  const prepMatch = fullText.match(/prep\s*time[:\s]+(\d+\s*(?:hr?s?|hours?|mins?|minutes?))/i);
  const cookMatch = fullText.match(/cook\s*time[:\s]+(\d+\s*(?:hr?s?|hours?|mins?|minutes?))/i);
  const totalMatch = fullText.match(/total\s*time[:\s]+(\d+\s*(?:hr?s?|hours?|mins?|minutes?))/i);
  const servingsMatch = fullText.match(/(?:serves?|servings?|yield)[:\s]+(\d+[^.\n]*)/i);
  if (prepMatch) prepTime = prepMatch[1].trim();
  if (cookMatch) cookTime = cookMatch[1].trim();
  if (totalMatch) totalTime = totalMatch[1].trim();
  if (servingsMatch) servings = servingsMatch[1].trim().split(/\s+/).slice(0, 3).join(" ");

  const ovenTemp = extractOvenTemp(fullText);
  const cookingMethod = detectCookingMethod(fullText);

  return {
    name,
    description,
    prepTime,
    cookTime,
    totalTime,
    servings,
    ovenTemp,
    cookingMethod,
    ingredients,
    instructions,
    source: url,
  };
}

/** Fetch via plain HTTP — used by the CLI save-recipe.js tool. */
export async function scrapeRecipe(url: string): Promise<Recipe> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  const html = await res.text();
  return parseRecipeFromHTML(html, url);
}
