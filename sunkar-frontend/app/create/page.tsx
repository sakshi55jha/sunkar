// ── Imports ─────────────────────────────────────────
'use client';

import { Headphones, Loader2, Plus, Send, UserCircle2, Bot, User, Trash2, AlertCircle, Clock } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

// ── Constants ─────────────────────────────────────────
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000';
const STORAGE_KEY = 'sunkar_sessions';
const MILLISECONDS_IN_DAY = 86400000;

// ── Types / Interfaces ─────────────────────────────────────────
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

interface RateLimitState {
  isLimited: boolean;
  message: string;
  retryAfter: number;
  retryAfterFull: number;
}

interface GroupedSessions {
  today: Session[];
  last7: Session[];
  last30: Session[];
  older: Session[];
}

// ── Helpers / Utils ─────────────────────────────────────────

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function truncateText(text: string, maxLength = 38): string {
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

function loadSessionsFromStorage(): Session[] {
  if (typeof window === 'undefined') return [];
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    return rawData ? JSON.parse(rawData) : [];
  } catch {
    return [];
  }
}

function saveSessionsToStorage(sessions: Session[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function formatRemainingSeconds(seconds: number): string {
  if (seconds <= 0) return '0s';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
}

// Organizes all sessions into time-based buckets for the sidebar
function groupSessionsByDate(sessions: Session[]): GroupedSessions {
  const currentTime = Date.now();
  const today: Session[] = [];
  const last7: Session[] = [];
  const last30: Session[] = [];
  const older: Session[] = [];

  sessions.forEach(session => {
    const ageInMilliseconds = currentTime - session.createdAt;
    if (ageInMilliseconds < MILLISECONDS_IN_DAY) {
      today.push(session);
    } else if (ageInMilliseconds < 7 * MILLISECONDS_IN_DAY) {
      last7.push(session);
    } else if (ageInMilliseconds < 30 * MILLISECONDS_IN_DAY) {
      last30.push(session);
    } else {
      older.push(session);
    }
  });

  return { today, last7, last30, older };
}

// Updates localStorage by either appending a new session or saving new messages
function upsertSessionStorage(
  previousSessions: Session[],
  sessionId: string,
  newMessages: Message[]
): Session[] {
  const sessionExists = previousSessions.find(session => session.sessionId === sessionId);

  if (sessionExists) {
    return previousSessions.map(session =>
      session.sessionId === sessionId ? { ...session, messages: newMessages } : session
    );
  }

  const firstUserMessage = newMessages.find(message => message.role === 'user');
  const title = firstUserMessage ? truncateText(firstUserMessage.content) : 'New Story';
  const newSession: Session = {
    sessionId,
    title,
    messages: newMessages,
    createdAt: Date.now(),
  };

  return [newSession, ...previousSessions];
}

// Sends backend request to clear session history
async function clearBackendSession(sessionId: string): Promise<void> {
  try {
    await fetch(`${BACKEND_URL}/api/stories/clear-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
  } catch {
    // Silently fail if backend is unreachable during cleanup
  }
}

// Sends backend request to load past memory into Gemini
async function loadBackendSession(session: Session): Promise<void> {
  try {
    await fetch(`${BACKEND_URL}/api/stories/load-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.sessionId,
        messages: session.messages,
      }),
    });
  } catch {
    // Silently fail
  }
}

// Extracts rate limit seconds from 429 response
async function parseRateLimitResponse(response: Response): Promise<RateLimitState> {
  try {
    const data = await response.json();
    const retryAfterSeconds = data.retryAfter ?? 60;
    return {
      isLimited: true,
      message: data.error ?? 'Too many requests. Please wait.',
      retryAfter: retryAfterSeconds,
      retryAfterFull: retryAfterSeconds,
    };
  } catch {
    return {
      isLimited: true,
      message: 'Too many requests. Please wait a moment.',
      retryAfter: 60,
      retryAfterFull: 60,
    };
  }
}

// ── Sub-components ─────────────────────────────────────────

function StorySidebarGroup({ 
  label, 
  items, 
  activeSessionId, 
  onLoadSession, 
  onDeleteSession 
}: { 
  label: string; 
  items: Session[]; 
  activeSessionId: string; 
  onLoadSession: (session: Session) => void; 
  onDeleteSession: (event: React.MouseEvent, sessionId: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mb-5">
      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800 mb-2 px-2">
        {label}
      </p>
      <div className="space-y-1">
        {items.map(session => (
          <button
            key={session.sessionId}
            onClick={() => onLoadSession(session)}
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
              onClick={(event) => onDeleteSession(event, session.sessionId)}
              className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all p-1 rounded shrink-0"
            >
              <Trash2 size={13} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatMessageBubble({ message, isLoadingCurrent }: { message: Message; isLoadingCurrent: boolean }) {
  const isUser = message.role === 'user';
  
  return (
    <div
      className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`flex max-w-[85%] gap-3 ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            isUser ? 'bg-emerald-600' : 'bg-emerald-500/20 text-emerald-500'
          }`}
        >
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>
        <div
          className={`p-4 rounded-2xl leading-relaxed whitespace-pre-wrap text-[15px] ${
            isUser
              ? 'bg-emerald-900/40 border border-emerald-500/30'
              : 'bg-white/5 border border-white/10'
          }`}
        >
          {message.content}
          {!isUser && !message.content && isLoadingCurrent && (
            <div className="flex gap-1 items-center h-5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RateLimitBanner({ rateLimit }: { rateLimit: RateLimitState }) {
  if (!rateLimit.isLimited) return null;

  const cooldownProgress = ((rateLimit.retryAfterFull - rateLimit.retryAfter) / rateLimit.retryAfterFull) * 100;

  return (
    <div className="mx-6 mb-2 p-4 bg-amber-950/40 border border-amber-700/40 rounded-2xl">
      <div className="flex items-start gap-3">
        <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-amber-400 text-sm font-medium">{rateLimit.message}</p>
          <div className="flex items-center gap-2 mt-2">
            <Clock size={13} className="text-amber-600" />
            <p className="text-amber-600 text-xs">
              Try again in {formatRemainingSeconds(rateLimit.retryAfter)}
            </p>
          </div>
          <div className="mt-3 w-full h-1 bg-amber-900/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-1000"
              style={{ width: `${cooldownProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────

export default function Create() {
  const { user } = useUser();
  const userId = user?.id;

  // ── State ─────────────────────────────────────────
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');


  const [rateLimit, setRateLimit] = useState<RateLimitState>({
    isLimited: false,
    message: '',
    retryAfter: 0,
    retryAfterFull: 0,
  });

  const sessionIdRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const rateLimitTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Effects ─────────────────────────────────────────
  
  // Initializes sessions from local storage after mount
  useEffect(() => {
    const savedSessions = loadSessionsFromStorage();
    setSessions(savedSessions);
  }, []);

  // Scrolls to the newest message whenever the chat updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Manages the rate limit cooldown timer to re-enable chat
  useEffect(() => {
    if (!rateLimit.isLimited) return;

    rateLimitTimerRef.current = setInterval(() => {
      setRateLimit(previousState => {
        const nextSeconds = previousState.retryAfter - 1;
        if (nextSeconds <= 0) {
          clearInterval(rateLimitTimerRef.current!);
          return { isLimited: false, message: '', retryAfter: 0, retryAfterFull: 0 };
        }
        return { ...previousState, retryAfter: nextSeconds };
      });
    }, 1000);

    return () => {
      if (rateLimitTimerRef.current) clearInterval(rateLimitTimerRef.current);
    };
  }, [rateLimit.isLimited]);

  // ── Handlers ─────────────────────────────────────────

  const handleNewChat = async () => {
    if (sessionIdRef.current) {
      await clearBackendSession(sessionIdRef.current);
    }

    sessionIdRef.current = '';
    setActiveSessionId('');
    setMessages([]);
    setPrompt('');
    setError('');
  };

  const handleLoadSession = async (session: Session) => {
    if (sessionIdRef.current && sessionIdRef.current !== session.sessionId) {
      await clearBackendSession(sessionIdRef.current);
    }

    sessionIdRef.current = session.sessionId;
    setActiveSessionId(session.sessionId);
    setMessages(session.messages);
    setPrompt('');
    setError('');

    await loadBackendSession(session);
  };

  const handleDeleteSession = async (event: React.MouseEvent, sessionIdToDelete: string) => {
    event.stopPropagation();
    await clearBackendSession(sessionIdToDelete);

    const updatedSessions = sessions.filter(session => session.sessionId !== sessionIdToDelete);
    setSessions(updatedSessions);
    saveSessionsToStorage(updatedSessions);

    if (sessionIdRef.current === sessionIdToDelete) {
      sessionIdRef.current = '';
      setActiveSessionId('');
      setMessages([]);
    }
  };

  const handleStreamChunks = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    const decoder = new TextDecoder();
    let accumulatedText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const parsedData = JSON.parse(line.replace('data: ', ''));
            if (parsedData.type === 'text') {
              accumulatedText += parsedData.data;
              setMessages(previousMessages => {
                const updatedMessages = [...previousMessages];
                updatedMessages[updatedMessages.length - 1].content = accumulatedText;
                return updatedMessages;
              });
            }
          } catch {
            // Ignore partial JSON chunks during stream
          }
        }
      }
    }
    
    return accumulatedText;
  };

  const handleGenerateStory = async () => {
    if (!prompt.trim() || loading || rateLimit.isLimited) return;

    const currentPrompt = prompt;
    setPrompt('');
    setError('');
    setLoading(true);

    if (!sessionIdRef.current) {
      const generatedId = generateSessionId();
      sessionIdRef.current = generatedId;
      setActiveSessionId(generatedId);
    }

    const activeSession = sessionIdRef.current;

    const optimisticMessages: Message[] = [
      ...messages,
      { role: 'user', content: currentPrompt },
      { role: 'assistant', content: '' },
    ];
    setMessages(optimisticMessages);

    try {
      const response = await fetch(`${BACKEND_URL}/api/stories/generate-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          userId: userId,
          sessionId: activeSession,
        }),
      });

      if (response.status === 429) {
        const limitState = await parseRateLimitResponse(response);
        setRateLimit(limitState);
        setMessages(previousMessages => previousMessages.slice(0, -1));
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const streamReader = response.body?.getReader();
      if (!streamReader) return;

      const finalText = await handleStreamChunks(streamReader);

      const finalMessages: Message[] = [
        ...messages,
        { role: 'user', content: currentPrompt },
        { role: 'assistant', content: finalText },
      ];
      
      setMessages(finalMessages);
      
      const newSessionList = upsertSessionStorage(sessions, activeSession, finalMessages);
      setSessions(newSessionList);
      saveSessionsToStorage(newSessionList);

    } catch (err: unknown) {
      if (!rateLimit.isLimited) {
        setError('Connection lost. Check if backend is running.');
      }
      setMessages(previousMessages => 
        previousMessages.filter((_, index) => 
          !(index === previousMessages.length - 1 && previousMessages[previousMessages.length - 1].content === '')
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const groupedSessions = groupSessionsByDate(sessions);

  // ── Render ─────────────────────────────────────────

  return (
    <div className="flex h-screen w-full max-w-[1440px] mx-auto bg-[#000502] text-white p-4 md:p-6 gap-6 overflow-hidden">
      
      <aside className="w-80 hidden md:flex flex-col bg-emerald-950/10 border border-emerald-900/20 rounded-[2rem] p-6">
        <button
          onClick={handleNewChat}
          className="flex items-center justify-between w-full p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/20 transition-all group"
        >
          <span className="font-bold text-sm">New Chat</span>
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
        </button>

        <div className="flex-1 mt-6 overflow-y-auto custom-scrollbar pr-1">
          {sessions.length === 0 ? (
            <p className="text-[10px] text-emerald-900 italic px-2 mt-4">
              No conversations yet...
            </p>
          ) : (
             <>
              <StorySidebarGroup 
                label="Today" 
                items={groupedSessions.today} 
                activeSessionId={activeSessionId} 
                onLoadSession={handleLoadSession} 
                onDeleteSession={handleDeleteSession} 
              />
              <StorySidebarGroup 
                label="Last 7 days" 
                items={groupedSessions.last7} 
                activeSessionId={activeSessionId} 
                onLoadSession={handleLoadSession} 
                onDeleteSession={handleDeleteSession} 
              />
              <StorySidebarGroup 
                label="Last 30 days" 
                items={groupedSessions.last30} 
                activeSessionId={activeSessionId} 
                onLoadSession={handleLoadSession} 
                onDeleteSession={handleDeleteSession} 
              />
              <StorySidebarGroup 
                label="Older" 
                items={groupedSessions.older} 
                activeSessionId={activeSessionId} 
                onLoadSession={handleLoadSession} 
                onDeleteSession={handleDeleteSession} 
              />
            </>
          )}
        </div>

        <div className="pt-6 border-t border-emerald-900/20 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <UserCircle2 />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-500">
              {user?.fullName || user?.firstName || 'User'}</p>
          </div>
        </div>
      </aside>

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
            messages.map((message, index) => (
              <ChatMessageBubble 
                key={index} 
                message={message} 
                isLoadingCurrent={loading && index === messages.length - 1} 
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <RateLimitBanner rateLimit={rateLimit} />

        <div className="p-6 bg-gradient-to-t from-[#000502] to-transparent">
          <div className={`max-w-4xl mx-auto relative flex items-center p-2 bg-black border rounded-2xl transition-all shadow-2xl ${
            rateLimit.isLimited
              ? 'border-amber-900/50 opacity-60'
              : 'border-emerald-900/50 focus-within:border-emerald-500'
          }`}>
            <input
              className="flex-1 bg-transparent px-4 py-3 outline-none text-sm md:text-base"
              placeholder={
                rateLimit.isLimited
                  ? `Rate limited — wait ${formatRemainingSeconds(rateLimit.retryAfter)}...`
                  : 'Tell me your situation...'
              }
              value={prompt}
              onChange={event => setPrompt(event.target.value)}
              onKeyDown={event => event.key === 'Enter' && handleGenerateStory()}
              disabled={loading || rateLimit.isLimited}
            />
            <button
              onClick={handleGenerateStory}
              disabled={loading || !prompt.trim() || rateLimit.isLimited}
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