'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

// We import the FEEDS list directly to build the sidebar navigation
import { FEEDS } from '@/lib/feedFetcher';

export default function ReaderUI({ articles }: { articles: any[] }) {
  const [selectedFeedId, setSelectedFeedId] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<any>(articles[0]);

  if (!articles || articles.length === 0) return <div>No articles found.</div>;

  // Filter articles based on the selected feed
  const displayedArticles = selectedFeedId === 'all' 
    ? articles 
    : articles.filter(a => a.feedId === selectedFeedId);

  return (
    <div className="flex h-screen bg-white text-black overflow-hidden font-sans">
      
      {/* PANE 1: Sources Sidebar (Dark Theme) */}
      <div className="w-64 bg-gray-900 text-gray-300 flex flex-col border-r border-gray-800 shrink-0">
        <div className="p-4 font-extrabold text-xl text-white tracking-wide border-b border-gray-800">
          My Reader
        </div>
        <div className="overflow-y-auto flex-grow p-4 space-y-6">
          
          {/* "All" Button */}
          <div>
            <button
              onClick={() => setSelectedFeedId('all')}
              className={`w-full text-left px-3 py-2 rounded-md font-semibold transition-colors ${
                selectedFeedId === 'all' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'
              }`}
            >
              All Articles
            </button>
          </div>

          {/* Grouped Feeds */}
          {['Newsletters', 'Aggregators', 'Reddit'].map(group => (
            <div key={group}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-3">
                {group}
              </h3>
              <div className="space-y-1">
                {FEEDS.filter(f => f.group === group).map(feed => (
                  <button
                    key={feed.id}
                    onClick={() => {
                      setSelectedFeedId(feed.id);
                      // Auto-select the first article when switching feeds
                      const firstArt = articles.find(a => a.feedId === feed.id);
                      setSelectedArticle(firstArt);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedFeedId === feed.id ? 'bg-gray-700 text-white' : 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {feed.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PANE 2: Article List */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-4 bg-gray-100 border-b border-gray-200 font-bold text-sm text-gray-600 uppercase tracking-wider sticky top-0">
          {selectedFeedId === 'all' ? 'Latest Feed' : FEEDS.find(f => f.id === selectedFeedId)?.name}
        </div>
        
        <div className="overflow-y-auto flex-grow">
          {displayedArticles.map((article) => (
            <button
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className={`w-full text-left p-4 border-b border-gray-200 hover:bg-white transition-colors ${
                selectedArticle?.id === article.id ? 'bg-white border-l-4 border-blue-500 shadow-sm relative z-10' : 'border-l-4 border-transparent'
              }`}
            >
              <div className="text-xs text-gray-400 font-medium mb-1">
                {article.pubDate ? formatDistanceToNow(new Date(article.pubDate)) + ' ago' : ''}
              </div>
              <h3 className="font-bold text-sm leading-snug mb-1 text-gray-900 line-clamp-3">{article.title}</h3>
              <div className={`text-xs font-semibold ${article.group === 'Reddit' ? 'text-orange-500' : 'text-blue-500'}`}>
                {article.feedName}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* PANE 3: Reading Area */}
      <div className="flex-1 bg-white flex flex-col h-screen overflow-hidden">
        {selectedArticle ? (
          <>
            {/* Standard Header */}
            <div className="shrink-0 px-10 py-8 border-b border-gray-100 flex items-start justify-between bg-white">
              <h1 className="text-3xl font-extrabold leading-tight text-gray-900 max-w-4xl">
                {selectedArticle.title}
              </h1>
            </div>

            <div className="grow overflow-y-auto p-10 bg-white">
              {selectedArticle.group === 'Reddit' || selectedArticle.hasFullText ? (
                
                // 📝 FULL TEXT READER (Substack, Newsletters, Reddit Text posts)
                <div 
                  className="prose prose-lg prose-slate max-w-3xl prose-img:rounded-xl prose-a:text-blue-600"
                  dangerouslySetInnerHTML={{ __html: selectedArticle.content }} 
                />
                
              ) : (

                // 🔗 LINK CARD (For Hacker News & External Links)
                <div className="max-w-2xl mt-10 p-8 rounded-2xl bg-gray-50 border border-gray-200 text-center">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">External Link</h2>
                  <p className="text-gray-600 mb-8">
                    This post points to an external website. Click the button below to read the full article securely in a new tab.
                  </p>
                  
                  <div className="flex flex-col space-y-3 items-center">
                    {/* Primary Link */}
                    <a 
                      href={selectedArticle.link} 
                      target="_blank" 
                      rel="noreferrer"
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors w-full max-w-xs shadow-md"
                    >
                      Read Article ↗
                    </a>
                    
                    {/* Render the HN Comments link safely */}
                    <div className="text-sm font-semibold text-orange-600 hover:text-orange-800 underline mt-4 prose prose-a:text-orange-600 max-w-none"
                         dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                    />
                  </div>
                </div>

              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 font-medium text-lg">
            Select an article to start reading
          </div>
        )}
      </div>

    </div>
  );
}