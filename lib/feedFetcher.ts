import Parser from 'rss-parser';

// Update the parser to pretend to be a real web browser
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
  { id: 'hn-top', name: 'HN (Top 100+)', group: 'Aggregators', url: 'https://hnrss.org/newest?points=100' },
  { id: 'reddit-ml', name: 'r/MachineLearning', group: 'Reddit', url: 'https://www.reddit.com/r/MachineLearning/.rss' },
  { id: 'reddit-localllama', name: 'r/LocalLLaMA', group: 'Reddit', url: 'https://www.reddit.com/r/LocalLLaMA/.rss' },
  { id: 'hn-top2', name: 'HN (Front Page)', group: 'Aggregators', url: 'https://news.ycombinator.com/rss' },
];

export async function getAllFeeds() {
  const allItems: any[] = [];
  
  for (const feed of FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      
      parsed.items.forEach(item => {
        // Grab whatever content is available
        const rawContent = item['content:encoded'] || item.content || item.description || "";
        
        // If it's short, it's probably just a link (like HN). If it's long, it's a full article.
        const hasFullText = !!item['content:encoded'] || rawContent.length > 800;
        
        allItems.push({
          id: item.link || item.guid,
          feedId: feed.id,
          feedName: feed.name,
          group: feed.group,
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          content: rawContent,
          snippet: item.contentSnippet ? item.contentSnippet.substring(0, 100) + '...' : "Click to view details...",
          hasFullText: hasFullText
        });
      });
    } catch (e) {
      console.error(`Failed to fetch ${feed.name}:`, e);
    }
  }

  // Sort newest to oldest
  return allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
}