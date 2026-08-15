'use client';

import { Component, ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FEEDS } from '@/lib/feedFetcher';

class HNErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) { console.error('HN thread render error:', error); }
  render() {
    if (this.state.hasError) {
      return <div className="p-8 text-red-500">Couldn't render this HN thread.</div>;
    }
    return this.props.children;
  }
}

export default function ReaderUI({ articles }: { articles: any[] }) {
  const [selectedFeedId, setSelectedFeedId] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<any>(articles[0]);
  // Controls which single pane shows on mobile: 'sources' | 'list' | 'reading'
  const [mobileView, setMobileView] = useState<'sources' | 'list' | 'reading'>('list');

  if (!articles || articles.length === 0) return <div>No articles found.</div>;

  // 🐛 FILTER BUG FIX: This strictly isolates the articles for the selected feed
  const displayedArticles = selectedFeedId === 'all' 
    ? articles 
    : articles.filter(a => a.feedId === selectedFeedId);

  return (
    <div className="flex h-screen bg-white text-black overflow-hidden font-sans">
      
      {/* PANE 1: Sources Sidebar */}
      <div className={`${mobileView === 'sources' ? 'flex' : 'hidden'} md:flex w-full md:w-64 bg-gray-900 text-gray-300 flex-col border-r border-gray-800 shrink-0`}>
        <div className="p-4 font-extrabold text-xl text-white tracking-wide border-b border-gray-800">
          Hemanth's Reader
        </div>
        <div className="overflow-y-auto flex-grow p-4 space-y-6">
          <div>
            <button
              onClick={() => { setSelectedFeedId('all'); setSelectedArticle(articles[0]); setMobileView('list'); }}
              className={`w-full text-left px-3 py-2 rounded-md font-semibold transition-colors ${selectedFeedId === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}`}
            >
              All Articles
            </button>
          </div>

          {['Newsletters', 'Aggregators', 'Reddit'].map(group => (
            <div key={group}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-3">{group}</h3>
              <div className="space-y-1">
                {FEEDS.filter(f => f.group === group).map(feed => (
                  <button
                    key={feed.id}
                    onClick={() => {
                      setSelectedFeedId(feed.id);
                      // Auto-select the first article in this specific feed
                      const firstArt = articles.find(a => a.feedId === feed.id);
                      setSelectedArticle(firstArt);
                      setMobileView('list');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${selectedFeedId === feed.id ? 'bg-gray-700 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
                  >
                    {feed.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <a href="https://hemanthpulicharla.pythonanywhere.com/blogposts/35"
          target="_blank"
          rel="noreferrer"
          className="p-3 text-xs text-gray-500 hover:text-gray-300 border-t border-gray-800 text-center transition-colors"
        >
          Built by Hemanth
        </a>
      </div>

      {/* PANE 2: Article List */}
      <div className={`${mobileView === 'list' ? 'flex' : 'hidden'} md:flex w-full md:w-80 bg-gray-50 border-r border-gray-200 flex-col shrink-0`}>
        <div className="p-4 bg-gray-100 border-b border-gray-200 font-bold text-sm text-gray-600 uppercase tracking-wider sticky top-0 flex items-center gap-2">
          <button onClick={() => setMobileView('sources')} className="md:hidden text-blue-600">←</button>
          {selectedFeedId === 'all' ? 'Latest Feed' : FEEDS.find(f => f.id === selectedFeedId)?.name}
        </div>
        <div className="overflow-y-auto flex-grow">
          {/* WE ARE NOW STRICTLY USING displayedArticles HERE */}
          {displayedArticles.map((article) => (
            <button
              key={article.id}
              onClick={() => { setSelectedArticle(article); setMobileView('reading'); }}
              className={`w-full text-left p-4 border-b border-gray-200 hover:bg-white transition-colors ${selectedArticle?.id === article.id ? 'bg-white border-l-4 border-blue-500 shadow-sm relative z-10' : 'border-l-4 border-transparent'}`}
            >
              {article.pubDate && <RelativeTime date={article.pubDate} />}
              <h3 className="font-bold text-sm leading-snug mb-1 text-gray-900 line-clamp-3">{article.title}</h3>
              <div className={`text-xs font-semibold ${article.group === 'Reddit' ? 'text-orange-500' : 'text-blue-500'}`}>
                {article.feedName}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* PANE 3: Reading Area */}
      <div className={`${mobileView === 'reading' ? 'flex' : 'hidden'} md:flex flex-1 bg-white flex-col h-screen overflow-hidden`}>
        {selectedArticle ? (
          <div className="grow overflow-y-auto p-10 bg-white">
            <button onClick={() => setMobileView('list')} className="md:hidden mb-4 text-blue-600 font-medium">← Back to list</button>

            {/* 🚀 IF IT IS HACKER NEWS: Render the Native Thread */}
            {selectedArticle.hnItemId ? (
              <HNErrorBoundary>
                <HNThread article={selectedArticle} />
              </HNErrorBoundary>
            ) : (
              // 📝 IF IT IS SUBSTACK / REDDIT: Render the standard article
              <>
                <h1 className="text-3xl font-extrabold leading-tight text-gray-900 max-w-3xl mx-auto mb-10 pb-6 border-b">
                  {selectedArticle.title}
                </h1>
                <div 
                  className="prose prose-lg prose-slate max-w-3xl mx-auto prose-img:rounded-xl prose-a:text-blue-600"
                  dangerouslySetInnerHTML={{ __html: selectedArticle.content }} 
                />
              </>
            )}

          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 font-medium text-lg">
            Select an article to start reading
          </div>
        )}
      </div>

    </div>
  );
}

/* =====================================================================
   NATIVE HACKER NEWS COMPONENTS
   These components fetch the Algolia API to render exact HN comments
===================================================================== */

function HNThread({ article }: { article: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Fetch the full thread directly from Hacker News API
    fetch(`https://hn.algolia.com/api/v1/items/${article.hnItemId}`)
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [article.hnItemId]);

  if (loading) return (
    <div className="flex justify-center mt-20 text-orange-500 font-bold animate-pulse">
      Loading Hacker News Thread...
    </div>
  );
  
  if (!data) return <div className="p-8 text-red-500">Failed to load HN thread.</div>;

  return (
    <div className="max-w-4xl mx-auto py-4">
       {/* HN Post Header */}
       <div className="mb-10 p-8 bg-orange-50 border border-orange-200 rounded-2xl">
         <h2 className="text-2xl font-extrabold mb-3 text-orange-950">{data.title}</h2>
         {data.url && (
           <a href={data.url} target="_blank" rel="noreferrer" className="text-orange-600 hover:underline break-all font-medium inline-flex items-center">
             Read Linked Article ↗
           </a>
         )}
         <div className="text-sm text-orange-800 mt-5 font-semibold">
           {data.points} points by <span className="text-orange-600">{data.author}</span> | {data.children?.length || 0} comments
         </div>
         {/* If it's an "Ask HN" or text post, render the text */}
         {data.text && (
           <div className="mt-6 prose max-w-none text-gray-800 bg-white p-6 rounded-xl shadow-sm border border-orange-100" dangerouslySetInnerHTML={{ __html: data.text }} />
         )}
       </div>

       {/* HN Comments Section */}
       <h3 className="text-xl font-bold mb-6 border-b pb-4 text-gray-800">Discussion Thread</h3>
       <div className="space-y-6">
         {data.children?.filter(Boolean).map((comment: any) => <HNComment key={comment.id} comment={comment} />)}
       </div>
    </div>
  )
}

function HNComment({ comment }: { comment: any }) {
  if (!comment || !comment.text) return null;

  return (
    <div className="mb-4 pl-4 border-l-2 border-gray-200 hover:border-orange-300 transition-colors">
       <div className="text-xs font-bold text-gray-500 mb-1 bg-gray-50 inline-block px-2 py-1 rounded">
         {comment.author}
       </div>
       <div className="prose prose-sm max-w-none text-gray-800 prose-a:text-blue-600 prose-p:leading-snug prose-pre:bg-gray-100 prose-pre:text-gray-800"
            dangerouslySetInnerHTML={{ __html: comment.text }} />

       {/* Recursively render child comments! */}
       {comment.children && comment.children.filter(Boolean).length > 0 && (
         <div className="mt-4 space-y-4">
           {comment.children.filter(Boolean).map((child: any) => <HNComment key={child.id} comment={child} />)}
         </div>
       )}
    </div>
  )
}

function RelativeTime({ date }: { date: string }) {
  const [text, setText] = useState('');
  useEffect(() => {
    setText(formatDistanceToNow(new Date(date)) + ' ago');
  }, [date]);
  return <div className="text-xs text-gray-400 font-medium mb-1">{text}</div>;
}
