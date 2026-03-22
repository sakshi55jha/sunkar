'use client';

import { Headphones, Loader2, Plus, Send, UserCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const USER_ID = 'user_sneha_2026';

export default function Create() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Fetch real history on load
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/stories/history?userId=${USER_ID}`)
      .then(res => res.json())
      .then(data => setHistory(data.map((s: any) => s.title).filter(Boolean)))
      .catch(() => setHistory([]));
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError('');
    setStreamingText('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/stories/generate-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, userId: USER_ID }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.replace('data: ', ''));
              if (json.type === 'text') setStreamingText(prev => prev + json.data);
            } catch (e) { /* partial chunk */ }
          }
        }
      }
    } catch (err) {
      setError("Connection lost. Check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full max-w-[1440px] mx-auto bg-[#000502] text-white p-6 gap-6">
      
      {/* SIDEBAR */}
      <aside className="w-80 hidden md:flex flex-col bg-emerald-950/10 border border-emerald-900/20 rounded-[2rem] p-6">
        <button className="flex items-center justify-between w-full p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/20 transition-all group">
          <span className="font-bold text-sm">New Idea</span>
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
        </button>

        <div className="flex-1 mt-8 overflow-y-auto">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800 mb-4 px-2">Recent</p>
          <div className="space-y-2">
            {history.length > 0 ? history.map((h, i) => (
              <button key={i} className="w-full text-left p-3 rounded-xl text-sm text-white/40 hover:text-white truncate flex items-center gap-3">
                <Headphones size={16} /> {h}
              </button>
            )) : (
              <p className="text-[10px] text-emerald-900 italic px-2">No history yet...</p>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-emerald-900/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center"><UserCircle2 /></div>
          <div><p className="text-sm font-bold">Sneha Jha</p></div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col bg-emerald-950/5 border border-emerald-900/10 rounded-[2rem] p-8 relative overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full z-10">
          {!streamingText ? (
            <div className="text-center">
              <h1 className="text-6xl font-medium mb-4">Share a thought. <br/><span className="text-white/20">Hear a story.</span></h1>
            </div>
          ) : (
            <div className="w-full p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
              <p className="text-lg leading-relaxed whitespace-pre-wrap">
                {streamingText}
                {loading && <span className="inline-block w-2 h-5 bg-emerald-500 ml-1 animate-pulse" />}
              </p>
            </div>
          )}
        </div>

        {/* INPUT */}
        <div className="max-w-4xl w-full mx-auto mt-8 z-20">
          <div className="relative flex items-center p-2 bg-black border border-emerald-900/30 rounded-full focus-within:border-emerald-500 transition-all">
            <input 
              className="flex-1 bg-transparent px-6 py-3 outline-none"
              placeholder="What's on your mind?..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button onClick={handleGenerate} disabled={loading} className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-black hover:bg-emerald-400">
              {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs mt-3 text-center">{error}</p>}
        </div>
      </main>
    </div>
  );
}