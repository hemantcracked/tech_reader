import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: ['content:encoded', 'description'],
  },
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  }
});

export const FEEDS = [
  { id: 'latent-space', name: 'Latent Space', group: 'Newsletters', url: 'https://www.latent.space/feed' },
  { id: 'hn-best', name: 'HN (Top 100+)', group: 'Aggregators', url: 'https://hnrss.org/frontpage?points=100' },
  { id: 'hn-front', name: 'HN (Front Page)', group: 'Aggregators', url: 'https://hnrss.org/frontpage' },
  { id: 'reddit-ml', name: 'r/MachineLearning', group: 'Reddit', url: 'https://www.reddit.com/r/MachineLearning/.rss' },
  { id: 'reddit-localllama', name: 'r/LocalLLaMA', group: 'Reddit', url: 'https://www.reddit.com/r/LocalLLaMA/.rss' },
];

export async function getAllFeeds() {
  const allItems: any[] = [];
  
  for (const feed of FEEDS) {
    try {
       if (feed.group === 'Reddit') {
        await new Promise(r => setTimeout(r, 6000)); // small gap before hitting Reddit
      }
      const parsed = await parser.parseURL(feed.url);
      
      parsed.items.forEach(item => {
        const rawContent = item['content:encoded'] || item.content || item.description || "";
        const hasFullText = !!item['content:encoded'] || rawContent.length > 800;

        // 👇 Grab the exact Hacker News Post ID
        let hnItemId = null;
        if (feed.group === 'Aggregators') {
          const sources = [item.guid, item.link, (item as any).comments].filter(Boolean);
          for (const s of sources) {
            const match = String(s).match(/id=(\d+)/);
            if (match) { hnItemId = match[1]; break; }
          }
        }

        allItems.push({
          id: item.link || item.guid,
          feedId: feed.id, // This is what fixes the filter bug!
          feedName: feed.name,
          group: feed.group,
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          content: rawContent,
          snippet: item.contentSnippet ? item.contentSnippet.substring(0, 100) + '...' : "Click to view details...",
          hasFullText: hasFullText,
          hnItemId: hnItemId // We send this to the UI
        });
      });
    } catch (e) {
      console.error(`Failed to fetch ${feed.name}:`, e);
    }
  }

  return allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
}