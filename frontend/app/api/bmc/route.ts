import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch the public profile page
    const response = await fetch('https://www.buymeacoffee.com/hackerney', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      next: { revalidate: 60 } // Cache for 1 minute
    });

    if (!response.ok) {
      throw new Error('Failed to fetch BMC page');
    }

    const html = await response.text();
    
    // Attempt to extract the supporter count using regex
    // Matches patterns like "1 supporter" or "1,234 supporters"
    // The text is usually inside a div/span, e.g. ">1 supporter</div>"
    const match = html.match(/>([0-9,]+) supporter(?:s?)</);
    
    let count = 0;
    if (match && match[1]) {
      count = parseInt(match[1].replace(/,/g, ''), 10);
    }

    return NextResponse.json({ count });
  } catch (error) {
    console.error('BMC Scrape Error:', error);
    // Return 0 instead of error to fail gracefully in UI
    return NextResponse.json({ count: 0 });
  }
}
