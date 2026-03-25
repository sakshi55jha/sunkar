'use client';
 
import { Headphones, Loader2, Plus, Send, UserCircle2, Bot, User } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
 
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const USER_ID = 'user_sneha_2026';
 
// Generate a unique sessionId once per browser tab
// This is what connects all messages in one conversation
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
 
interface Message {
  role: 'user' | 'assistant';
  content: string;
}
 
export default function Create() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState('');
 
  // sessionId lives in a ref so it persists across renders but doesn't cause re-renders
  const sessionIdRef = useRef<string>(generateSessionId());
 
  const messagesEndRef = useRef<HTMLDivElement>(null);
 
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
 
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
 
  // Load story history from backend on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/stories/history?userId=${USER_ID}`)
      .then(res => res.json())
      .then(data =>
        setHistory(data.map((s: any) => s.generatedTitle || 'Untitled').filter(Boolean))
      )
      .catch(() => setHistory([]));
  }, []);
 
  // Called when user clicks "New Chat"
  // Clears messages on screen AND tells backend to clear the session memory
  const handleNewChat = async () => {
    const sessionId = sessionIdRef.current;
 
    // Tell backend to clear this session's history
    try {
      await fetch(`${BACKEND_URL}/api/stories/clear-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
    } catch {
      // Silently ignore — even if this fails, we generate a new sessionId below
    }
 
    // Generate a brand new sessionId for the next conversation
    sessionIdRef.current = generateSessionId();
 
    // Clear messages on screen
    setMessages([]);
    setError('');
    setPrompt('');
  };
 
  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
 
    const userMessage = prompt;
    setPrompt('');
    setError('');
    setLoading(true);
 
    // Add user message + empty assistant bubble to UI
    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: '' },
    ]);
 
    try {
      const res = await fetch(`${BACKEND_URL}/api/stories/generate-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage,
          userId: USER_ID,
          sessionId: sessionIdRef.current, // ← send sessionId with every request
        }),
      });
 
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;
 
      let accumulatedText = '';
 
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
 
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
 
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.replace('data: ', ''));
              if (json.type === 'text') {
                accumulatedText += json.data;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = accumulatedText;
                  return newMessages;
                });
              }
            } catch {
              // partial chunk, skip
            }
          }
        }
      }
    } catch {
      setError('Connection lost. Check if backend is running.');
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="flex h-screen w-full max-w-[1440px] mx-auto bg-[#000502] text-white p-4 md:p-6 gap-6 overflow-hidden">
 
      {/* SIDEBAR */}
      <aside className="w-80 hidden md:flex flex-col bg-emerald-950/10 border border-emerald-900/20 rounded-[2rem] p-6">
        <button
          onClick={handleNewChat}  // ← now calls handleNewChat instead of just setMessages([])
          className="flex items-center justify-between w-full p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/20 transition-all group"
        >
          <span className="font-bold text-sm">New Chat</span>
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
        </button>
 
        <div className="flex-1 mt-8 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800 mb-4 px-2">
            History
          </p>
          <div className="space-y-2">
            {history.length > 0 ? (
              history.map((h, i) => (
                <button
                  key={i}
                  className="w-full text-left p-3 rounded-xl text-sm text-white/40 hover:text-white truncate flex items-center gap-3"
                >
                  <Headphones size={16} /> {h}
                </button>
              ))
            ) : (
              <p className="text-[10px] text-emerald-900 italic px-2">No history yet...</p>
            )}
          </div>
        </div>
 
        <div className="pt-6 border-t border-emerald-900/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <UserCircle2 />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-500">Sneha Jha</p>
          </div>
        </div>
      </aside>
 
      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col bg-emerald-950/5 border border-emerald-900/10 rounded-[2rem] relative overflow-hidden">
 
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <h1 className="text-5xl font-medium mb-4">
                Sunkar <span className="text-emerald-500 italic">GPT</span>
              </h1>
              <p className="text-white/30 text-lg">What story do you want to tell today?</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex max-w-[85%] gap-3 ${
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === 'user'
                        ? 'bg-emerald-600'
                        : 'bg-emerald-500/20 text-emerald-500'
                    }`}
                  >
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div
                    className={`p-4 rounded-2xl leading-relaxed whitespace-pre-wrap text-[15px] ${
                      msg.role === 'user'
                        ? 'bg-emerald-900/40 border border-emerald-500/30'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    {msg.content}
                    {msg.role === 'assistant' && !msg.content && loading && (
                      <Loader2 className="animate-spin text-emerald-500" size={18} />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
 
        {/* INPUT BOX */}
        <div className="p-6 bg-gradient-to-t from-[#000502] to-transparent">
          <div className="max-w-4xl mx-auto relative flex items-center p-2 bg-black border border-emerald-900/50 rounded-2xl focus-within:border-emerald-500 transition-all shadow-2xl">
            <input
              className="flex-1 bg-transparent px-4 py-3 outline-none text-sm md:text-base"
              placeholder="Tell me your situation..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              disabled={loading}
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-black hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 transition-all"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </div>
          {error && (
            <p className="text-red-400 text-xs mt-3 text-center font-mono">{error}</p>
          )}
        </div>
      </main>
    </div>
  );
}
 
