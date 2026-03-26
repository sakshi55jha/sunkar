'use client';

import { Headphones, Loader2, Plus, Send, UserCircle2, Bot, User, Trash2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const USER_ID = 'user_sneha_2026';
const STORAGE_KEY = 'sunkar_sessions';

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Session {
  sessionId: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function truncate(str: string, max = 38) {
  return str.length > max ? str.slice(0, max) + '...' : str;
}

function loadSessions(): Session[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// ─────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────
export default function Create() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');

  const sessionIdRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const saved = loadSessions();
    setSessions(saved);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Save / update a session in state + localStorage ──
  const upsertSession = (sessionId: string, newMessages: Message[]) => {
    setSessions(prev => {
      const exists = prev.find(s => s.sessionId === sessionId);
      let updated: Session[];

      if (exists) {
        updated = prev.map(s =>
          s.sessionId === sessionId ? { ...s, messages: newMessages } : s
        );
      } else {
        const firstUserMsg = newMessages.find(m => m.role === 'user');
        const title = firstUserMsg ? truncate(firstUserMsg.content) : 'New Story';
        const newSession: Session = {
          sessionId,
          title,
          messages: newMessages,
          createdAt: Date.now(),
        };
        updated = [newSession, ...prev];
      }

      saveSessions(updated);
      return updated;
    });
  };

  // ── New Chat ─────────────────────────────────────────
  const handleNewChat = async () => {
    if (sessionIdRef.current) {
      try {
        await fetch(`${BACKEND_URL}/api/stories/clear-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sessionIdRef.current }),
        });
      } catch { /* ignore */ }
    }

    sessionIdRef.current = '';
    setActiveSessionId('');
    setMessages([]);
    setPrompt('');
    setError('');
  };

  // ── Load past session from sidebar ───────────────────
  const handleLoadSession = async (session: Session) => {
    // Clear backend memory for previous session
    if (sessionIdRef.current && sessionIdRef.current !== session.sessionId) {
      try {
        await fetch(`${BACKEND_URL}/api/stories/clear-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sessionIdRef.current }),
        });
      } catch { /* ignore */ }
    }

    // Set the active session
    sessionIdRef.current = session.sessionId;
    setActiveSessionId(session.sessionId);
    setMessages(session.messages);
    setPrompt('');
    setError('');

    // Re-hydrate backend memory so follow-up messages have context
    try {
      await fetch(`${BACKEND_URL}/api/stories/load-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          messages: session.messages,
        }),
      });
    } catch { /* ignore */ }
  };

  // ── Delete a session ──────────────────────────────────
  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();

    try {
      await fetch(`${BACKEND_URL}/api/stories/clear-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
    } catch { /* ignore */ }

    const updated = sessions.filter(s => s.sessionId !== sessionId);
    setSessions(updated);
    saveSessions(updated);

    if (sessionIdRef.current === sessionId) {
      sessionIdRef.current = '';
      setActiveSessionId('');
      setMessages([]);
    }
  };

  // ── Generate ──────────────────────────────────────────
  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;

    const userMessage = prompt;
    setPrompt('');
    setError('');
    setLoading(true);

    // Create new session if none is active
    if (!sessionIdRef.current) {
      const newId = generateSessionId();
      sessionIdRef.current = newId;
      setActiveSessionId(newId);
    }

    const currentSessionId = sessionIdRef.current;

    // Optimistically add user message + empty assistant bubble
    const optimisticMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: '' },
    ];
    setMessages(optimisticMessages);

    try {
      const res = await fetch(`${BACKEND_URL}/api/stories/generate-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage,
          userId: USER_ID,
          sessionId: currentSessionId,
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
                  const updated = [...prev];
                  updated[updated.length - 1].content = accumulatedText;
                  return updated;
                });
              }
            } catch { /* partial chunk */ }
          }
        }
      }

      // Save completed conversation to localStorage
      const finalMessages: Message[] = [
        ...messages,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: accumulatedText },
      ];
      setMessages(finalMessages);
      upsertSession(currentSessionId, finalMessages);

    } catch {
      setError('Connection lost. Check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // ── Group sessions by date like ChatGPT ──────────────
  const groupSessions = () => {
    const now = Date.now();
    const DAY = 86400000;
    const today: Session[] = [];
    const last7: Session[] = [];
    const last30: Session[] = [];
    const older: Session[] = [];

    sessions.forEach(s => {
      const age = now - s.createdAt;
      if (age < DAY) today.push(s);
      else if (age < 7 * DAY) last7.push(s);
      else if (age < 30 * DAY) last30.push(s);
      else older.push(s);
    });

    return { today, last7, last30, older };
  };

  const renderGroup = (label: string, items: Session[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-5" key={label}>
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800 mb-2 px-2">
          {label}
        </p>
        <div className="space-y-1">
          {items.map(session => (
            <button
              key={session.sessionId}
              onClick={() => handleLoadSession(session)}
              className={`w-full text-left p-3 rounded-xl text-sm flex items-center gap-3 group transition-all ${
                activeSessionId === session.sessionId
                  ? 'bg-emerald-500/20 text-white border border-emerald-500/30'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <Headphones size={14} className="shrink-0 opacity-60" />
              <span className="flex-1 truncate text-left">{session.title}</span>
              <span
                role="button"
                onClick={e => handleDeleteSession(e, session.sessionId)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all p-1 rounded shrink-0"
              >
                <Trash2 size={13} />
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const groups = groupSessions();

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <div className="flex h-screen w-full max-w-[1440px] mx-auto bg-[#000502] text-white p-4 md:p-6 gap-6 overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-80 hidden md:flex flex-col bg-emerald-950/10 border border-emerald-900/20 rounded-[2rem] p-6">

        {/* New Chat */}
        <button
          onClick={handleNewChat}
          className="flex items-center justify-between w-full p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/20 transition-all group"
        >
          <span className="font-bold text-sm">New Chat</span>
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
        </button>

        {/* Session list */}
        <div className="flex-1 mt-6 overflow-y-auto custom-scrollbar pr-1">
          {sessions.length === 0 ? (
            <p className="text-[10px] text-emerald-900 italic px-2 mt-4">
              No conversations yet...
            </p>
          ) : (
            <>
              {renderGroup('Today', groups.today)}
              {renderGroup('Last 7 days', groups.last7)}
              {renderGroup('Last 30 days', groups.last30)}
              {renderGroup('Older', groups.older)}
            </>
          )}
        </div>

        {/* User profile */}
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