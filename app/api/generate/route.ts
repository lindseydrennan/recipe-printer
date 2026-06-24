import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { parseRecipeFromHTML } from "@/lib/scraper";
import { buildRecipeHTML } from "@/lib/pdf-template";

export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { url } = body;
  if (!url || !url.startsWith("http")) {
    return NextResponse.json({ error: "A valid URL is required." }, { status: 400 });
  }

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    // Use Puppeteer to fetch — handles JS-rendered content and bypasses basic bot detection
    const fetchPage = await browser.newPage();
    await fetchPage.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await fetchPage.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    const html = await fetchPage.content();
    await fetchPage.close();

    const recipe = parseRecipeFromHTML(html, url);

    if (!recipe.ingredients.length && !recipe.instructions.length) {
      return NextResponse.json(
        { error: "No recipe data found — this site may block scrapers or use an unsupported format." },
        { status: 422 }
      );
    }

    // Render recipe card to PDF
    // Viewport 816×1056 = 8.5×11in at 96dpi; template uses pt units (72dpi = exact Figma match)
    const pdfPage = await browser.newPage();
    await pdfPage.setViewport({ width: 816, height: 1056 });
    await pdfPage.setContent(buildRecipeHTML(recipe), { waitUntil: "load", timeout: 15000 });
    const pdf = await pdfPage.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    const filename = recipe.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}
