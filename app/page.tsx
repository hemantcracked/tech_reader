import { getAllFeeds } from '@/lib/feedFetcher';
import ReaderUI from './ReaderUI';

// Revalidate the data every hour (3600 seconds) so you don't spam the RSS feeds
export const revalidate = 3600; 

export default async function Home() {
  const articles = await getAllFeeds();

  return (
    <main>
      <ReaderUI articles={articles} />
    </main>
  );
}