export const runtime = 'nodejs'; // 👈 force Node.js runtime


import { NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // Adjust this to your auth implementation

import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query } = await req.json();

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 IndieBot/1.0"
    );

    const searchUrl = `https://www.reddit.com/search/?q=${encodeURIComponent(query)}&type=link`;

    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector('a[href*="/comments/"]', { timeout: 15000 });

    const postUrls = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="/comments/"]'));
      const urls = anchors
        .map(a => a.getAttribute("href"))
        .filter(Boolean)
        .map(href => `https://www.reddit.com${href!.split("?")[0]}`);
      return Array.from(new Set(urls));
    });

    return NextResponse.json({ data: postUrls }, { status: 200 });

  } catch (err: any) {
    console.error("Scraping error:", err);
    return NextResponse.json({ error: "Scraping failed", message: err.message }, { status: 500 });

  } finally {
    if (browser) await browser.close();
  }
}
