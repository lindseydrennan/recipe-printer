import { NextRequest, NextResponse } from "next/server";
import { parseRecipeFromHTML } from "@/lib/scraper";
import { buildRecipeHTML } from "@/lib/pdf-template";

export const maxDuration = 300;

async function getBrowser() {
  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium-min")).default;
    const puppeteer = (await import("puppeteer-core")).default;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(
        "https://github.com/nichochar/chromium-binaries/releases/download/v149.0.0/chromium-v149.0.0-pack.tar"
      ),
      headless: true,
    });
  }
  const puppeteer = (await import("puppeteer")).default;
  return puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

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

  let browser;
  try {
    browser = await getBrowser();
  } catch {
    return NextResponse.json(
      { error: "PDF engine failed to start — please try again." },
      { status: 503 }
    );
  }

  try {
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
