import { NextResponse } from 'next/server';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
  }

  try {
    // 1. Fetch the target website, pretending to be a real browser
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch the website');

    const html = await response.text();

    // 2. Load the HTML into a virtual DOM
    const doc = new JSDOM(html, { url: targetUrl });

    // 3. Use Mozilla's Readability to strip ads, navbars, and junk
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error('Readability could not parse this page.');
    }

    // 4. Return the clean, pure article HTML!
    return NextResponse.json({ content: article.content, title: article.title });
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: 'Could not extract article.' }, { status: 500 });
  }
}