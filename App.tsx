
import React, { useState, useMemo } from 'react';
import { Category, Screenshot, ChatMessage } from './types';
import { analyzeImage, chatWithImage, semanticSearch } from './services/geminiService';
import MemoryCard from './components/MemoryCard';
import KnowledgeGraph from './components/KnowledgeGraph';
import ActionablePanel from './components/ActionablePanel';

const MOCK_DATA: Screenshot[] = [
  {
    id: '1',
    url: 'https://picsum.photos/seed/tech1/800/1200',
    timestamp: Date.now() - 86400000 * 0.5, // Today
    category: Category.TECHNICAL,
    summary: 'A code snippet showing React Hooks implementation with useEffect and cleanup.',
    ocrText: 'import React, { useEffect } from "react"; useEffect(() => { return () => console.log("cleanup"); }, []);',
    viewCount: 12,
    insights: { links: ['react.dev'], phones: [], addresses: [] }
  },
  {
    id: '2',
    url: 'https://picsum.photos/seed/shop1/800/1200',
    timestamp: Date.now() - 86400000 * 1.2, // Yesterday
    category: Category.SHOPPING,
    summary: 'An Amazon product page for a wireless noise-canceling headphone on sale.',
    ocrText: 'Sony WH-1000XM5. Price: $299. Add to Cart. Ships to New York.',
    viewCount: 4,
    insights: { links: ['amazon.com/sony-wh1000xm5'], phones: [], addresses: ['New York, NY'] }
  },
  {
    id: '3',
    url: 'https://picsum.photos/seed/chat1/800/1200',
    timestamp: Date.now() - 86400000 * 5, // Last week
    category: Category.CHAT,
    summary: 'A chat conversation discussing project deadlines and deliverables.',
    ocrText: 'John: When is the PR due? Sarah: Aim for Friday EOD.',
    viewCount: 2,
    insights: { links: [], phones: [], addresses: [] }
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'brain' | 'gallery' | 'search' | 'settings'>('brain');
  const [screenshots, setScreenshots] = useState<Screenshot[]>(MOCK_DATA);
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [currentMemoryIdx, setCurrentMemoryIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Helper to group screenshots by date
  const groupedScreenshots = useMemo(() => {
    const groups: { [key: string]: Screenshot[] } = {};
    const sorted = [...screenshots].sort((a, b) => b.timestamp - a.timestamp);
    
    sorted.forEach(s => {
      const date = new Date(s.timestamp);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let label = date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
      if (date.toDateString() === today.toDateString()) label = 'Today';
      else if (date.toDateString() === yesterday.toDateString()) label = 'Yesterday';

      if (!groups[label]) groups[label] = [];
      groups[label].push(s);
    });
    return Object.entries(groups);
  }, [screenshots]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    const newItems: Screenshot[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      const fileData = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      const base64 = fileData.split(',')[1];
      try {
        const analysis = await analyzeImage(base64);
        newItems.push({
          id: Math.random().toString(36).substr(2, 9),
          url: fileData,
          timestamp: Date.now(),
          category: (analysis.category as Category) || Category.MISC,
          summary: analysis.summary || 'No summary available',
          ocrText: analysis.ocrText || '',
          viewCount: 0,
          insights: analysis.insights || { links: [], phones: [], addresses: [] }
        });
      } catch (err) {
        console.error("Analysis failed", err);
      }
    }

    setScreenshots(prev => [...newItems, ...prev]);
    setIsImporting(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const bestMatchId = await semanticSearch(searchQuery, screenshots);
      setSearchResult(bestMatchId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !selectedScreenshot) return;
    const userMsg: ChatMessage = { role: 'user', content: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await chatWithImage(chatInput, `${selectedScreenshot.summary} OCR: ${selectedScreenshot.ocrText}`);
      setChatHistory(prev => [...prev, { role: 'assistant', content: response || 'No response.' }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'AI Brain is offline temporarily.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const refreshMemory = () => {
    setCurrentMemoryIdx(Math.floor(Math.random() * screenshots.length));
  };

  const graphNodes = screenshots.map(s => ({
    id: s.id,
    label: s.category,
    group: s.category
  }));
  const graphLinks = screenshots.slice(0, -1).map((s, i) => ({
    source: s.id,
    target: screenshots[i + 1].id
  }));

  if (isLocked) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-6 shadow-2xl animate-pulse">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">SnapMind Vault</h1>
        <p className="text-gray-400 mb-8">Biometric authentication required</p>
        <button 
          onClick={() => setIsLocked(false)}
          className="px-8 py-3 bg-white text-gray-900 rounded-2xl font-semibold hover:bg-gray-100 transition-colors"
        >
          Unlock with FaceID
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 flex flex-col bg-white">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-gray-900">SnapMind</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[9px] font-bold text-green-700 uppercase tracking-widest">On-Device Engine</span>
        </div>
      </header>

      {/* Main Content Areas */}
      <main className={`flex-1 ${activeTab === 'gallery' ? 'px-1' : 'px-6 max-w-4xl mx-auto w-full'} pt-6 space-y-12`}>
        {activeTab === 'brain' && (
          <>
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Flash Recall</h2>
                  <p className="text-gray-500 text-sm">Resurfacing insights to build your second brain.</p>
                </div>
                <button 
                  onClick={() => setIsLocked(true)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </button>
              </div>
              {screenshots.length > 0 && (
                <MemoryCard 
                  screenshot={screenshots[currentMemoryIdx % screenshots.length]} 
                  onRefresh={refreshMemory} 
                />
              )}
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 px-1">Knowledge Mesh</h3>
              <KnowledgeGraph nodes={graphNodes} links={graphLinks} />
            </section>
          </>
        )}

        {activeTab === 'gallery' && (
          <section className="space-y-6 pb-20">
            {isImporting && (
              <div className="mx-5 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3 animate-pulse">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-blue-700 text-xs font-semibold">Generating semantic index...</p>
              </div>
            )}
            
            {groupedScreenshots.map(([dateLabel, items]) => (
              <div key={dateLabel} className="space-y-2">
                <div className="px-5 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 tracking-tight">{dateLabel}</h3>
                  <span className="text-[10px] text-gray-400 font-medium">{items.length} items</span>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-0.5">
                  {items.map(s => (
                    <div 
                      key={s.id} 
                      onClick={() => { setSelectedScreenshot(s); setChatHistory([]); }}
                      className="aspect-square bg-gray-100 overflow-hidden cursor-pointer relative group active:scale-95 transition-transform"
                    >
                      <img src={s.url} className="w-full h-full object-cover transition-opacity group-hover:opacity-90" />
                      {s.category === Category.TECHNICAL && (
                        <div className="absolute top-1 right-1">
                           <div className="w-2 h-2 bg-blue-500 rounded-full shadow-sm"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {screenshots.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 text-center px-10">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                   <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                   </svg>
                </div>
                <h3 className="text-gray-900 font-bold">No Screenshots Yet</h3>
                <p className="text-gray-400 text-sm mt-1">Import images to start building your knowledge base locally.</p>
              </div>
            )}

            {/* Floating Action Button for Import */}
            <label className="fixed bottom-32 right-6 cursor-pointer bg-black text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all z-40">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*" />
            </label>
          </section>
        )}

        {activeTab === 'search' && (
          <section className="space-y-8 pt-4">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Find anything... 'the react hook one'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-base focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-gray-400 shadow-inner"
              />
              <button 
                onClick={handleSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
              >
                {isSearching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
              </button>
            </div>

            {searchResult && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Top Match</h3>
                {screenshots.filter(s => s.id === searchResult).map(s => (
                  <div key={s.id} onClick={() => setSelectedScreenshot(s)} className="p-4 bg-white rounded-2xl border border-gray-100 flex gap-4 cursor-pointer hover:border-black transition-all group">
                    <div className="w-20 aspect-square rounded-lg overflow-hidden flex-shrink-0 bg-gray-50">
                      <img src={s.url} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-black border border-black/10 px-1.5 py-0.5 rounded uppercase">{s.category}</span>
                      </div>
                      <p className="mt-1.5 text-gray-800 text-sm font-medium line-clamp-2 leading-snug">{s.summary}</p>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                       <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                       </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {!searchResult && !isSearching && searchQuery && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm">No semantic matches in your local brain.</p>
              </div>
            )}
          </section>
        )}

        {activeTab === 'settings' && (
          <section className="space-y-8 divide-y divide-gray-100">
            <div className="pb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">System</h2>
              <p className="text-gray-500 text-sm">Core configurations for SnapMind engine.</p>
            </div>

            <div className="py-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-gray-900">Biometric Lock</p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Security Layer</p>
                </div>
                <div className="w-10 h-5 bg-black rounded-full relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-gray-900">Auto-Index</p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Background Processing</p>
                </div>
                <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="py-6">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Local Optimization</h3>
              <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-gray-900 font-bold text-sm">Cluster Duplicates</p>
                  <p className="text-gray-500 text-[10px]">Identify 4 visually similar items.</p>
                </div>
                <button className="px-3 py-1.5 bg-black text-white rounded-lg text-[10px] font-bold hover:scale-105 active:scale-95 transition-transform">
                  Optimize
                </button>
              </div>
            </div>

            <div className="py-8 text-center">
              <p className="text-gray-300 text-[10px] font-bold uppercase tracking-[0.2em]">SnapMind v1.2.0 • 100% Private</p>
            </div>
          </section>
        )}
      </main>

      {/* Global Bottom Navigation */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/90 backdrop-blur-2xl rounded-[2.5rem] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-1.5 z-50">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setActiveTab('brain')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-[2rem] transition-all ${activeTab === 'brain' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-[8px] font-extrabold uppercase tracking-widest">Brain</span>
          </button>
          <button 
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-[2rem] transition-all ${activeTab === 'gallery' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            <span className="text-[8px] font-extrabold uppercase tracking-widest">Library</span>
          </button>
          <button 
            onClick={() => setActiveTab('search')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-[2rem] transition-all ${activeTab === 'search' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-[8px] font-extrabold uppercase tracking-widest">Search</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-[2rem] transition-all ${activeTab === 'settings' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-900'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[8px] font-extrabold uppercase tracking-widest">System</span>
          </button>
        </div>
      </nav>

      {/* Screenshot Detail Overlay */}
      {selectedScreenshot && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute top-6 left-6 z-10">
            <button 
              onClick={() => setSelectedScreenshot(null)}
              className="p-3 bg-white/90 backdrop-blur rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all border border-gray-100"
            >
              <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          </div>

          <div className="w-full md:w-1/2 h-[60vh] md:h-full bg-gray-50 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-gray-100">
            <img 
              src={selectedScreenshot.url} 
              className="max-w-full max-h-full rounded-2xl shadow-xl object-contain bg-white" 
            />
          </div>

          <div className="w-full md:w-1/2 h-[40vh] md:h-full overflow-y-auto flex flex-col">
            <div className="p-8 space-y-8 flex-1">
              <div>
                <span className="text-[10px] font-bold text-black border border-black/10 px-2 py-0.5 rounded-full uppercase tracking-widest">{selectedScreenshot.category}</span>
                <p className="mt-4 text-2xl font-bold text-gray-900 leading-tight tracking-tight">{selectedScreenshot.summary}</p>
                <p className="mt-2 text-xs text-gray-400 font-medium">{new Date(selectedScreenshot.timestamp).toLocaleString()}</p>
              </div>

              <ActionablePanel screenshot={selectedScreenshot} />

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Semantic Context</h4>
                <div className="p-4 bg-gray-50 rounded-xl text-[11px] text-gray-500 font-mono leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {selectedScreenshot.ocrText || "No readable text detected."}
                </div>
              </div>

              <div className="space-y-4 pb-20">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Deep Context Query</h4>
                <div className="space-y-4">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-black text-white' : 'bg-gray-100 text-gray-800'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 p-4 rounded-2xl flex gap-1 items-center">
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                  placeholder="Ask a question about this screen..."
                  className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                />
                <button 
                  onClick={handleChat}
                  disabled={isChatLoading}
                  className="p-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 active:scale-90"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
