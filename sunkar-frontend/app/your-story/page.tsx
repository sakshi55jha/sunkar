'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

import Link from 'next/link';
import {
  Edit2, Trash2, Headphones, Play, Library,
  Loader2, Globe, EyeOff, RefreshCw, AlertCircle, Clock, Download
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';


// TYPES
// ─────────────────────────────────────────
interface CreatorStory {
  id:          string;
  title:       string;
  mood:        string | null;
  voiceModel:  string;
  audioUrl:    string | null;
  status:      'PROCESSING' | 'READY' | 'FAILED';
  errorLogs:   string | null;
  isPublished: boolean;
  createdAt:   string;
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  });
}

const VOICE_LABELS: Record<string, string> = {
  'warm-female': 'Warm & Soothing',
  'deep-male':   'Deep & Resonant',
  'storyteller': 'Classic Storyteller',
  'energetic':   'Energetic & Bright',
};

// ─────────────────────────────────────────
// STATUS BADGE COMPONENT
// ─────────────────────────────────────────
function StatusBadge({ status }: { status: CreatorStory['status'] }) {
  if (status === 'PROCESSING') {
    return (
      <span className="flex items-center gap-1.5 text-amber-600 text-[10px] font-bold tracking-[0.15em] uppercase">
        <Loader2 className="w-3 h-3 animate-spin" />
        Processing
      </span>
    );
  }

  if (status === 'FAILED') {
    return (
      <span className="flex items-center gap-1.5 text-red-600 text-[10px] font-bold tracking-[0.15em] uppercase">
        <AlertCircle className="w-3 h-3" />
        Failed
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold tracking-[0.15em] uppercase">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Ready
    </span>
  );
}

// ─────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────
export default function YourStory() {
  const { user, isLoaded } = useUser();

  const USER_ID = user?.id;

  const [stories, setStories]   = useState<CreatorStory[]>([]);
  const [loading, setLoading]   = useState(true);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [retryingId, setRetryingId]   = useState<string | null>(null);

   // Load stories on mount
  useEffect(() => {
    if (isLoaded && USER_ID) {
      fetchStories();
    }
  }, [isLoaded, USER_ID]);

  // Poll every 4 seconds if any story is still processing
  useEffect(() => {
    const hasProcessing = stories.some(s => s.status === 'PROCESSING');

    if (!hasProcessing || !USER_ID) return;


    const interval = setInterval(fetchStories, 4000);
    return () => clearInterval(interval);
  }, [stories, USER_ID]);

  const fetchStories = async () => {
        if (!USER_ID) return;

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/creator/stories?userId=${USER_ID}`
      );
      if (!res.ok) return;

      const data = await res.json();
      setStories(data);
    } catch {
      // ignore network errors silently
    } finally {
      setLoading(false);
    }
  };

  // ── Delete story ──────────────────────────────────
  const handleDelete = async (storyId: string) => {
    if (!confirm('Delete this story permanently?')) return;

        if (!USER_ID) return;


    setDeletingId(storyId);
    try {
      await fetch(`${BACKEND_URL}/api/creator/stories/${storyId}`, {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID }),
      });
      setStories(prev => prev.filter(s => s.id !== storyId));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  // ── Toggle publish / unpublish ────────────────────
  const handleTogglePublish = async (story: CreatorStory) => {
        if (!USER_ID) return;
    setPublishingId(story.id);
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/creator/stories/${story.id}/publish`,
        {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isPublished: !story.isPublished,
            userId:      USER_ID,
          }),
        }
      );
      const data = await res.json();
      setStories(prev =>
        prev.map(s =>
          s.id === story.id ? { ...s, isPublished: data.isPublished } : s
        )
      );
    } catch {
      // ignore
    } finally {
      setPublishingId(null);
    }
  };

  // ── Retry failed audio generation ────────────────
  const handleRetry = async (storyId: string) => {
        if (!USER_ID) return;

    setRetryingId(storyId);
    try {
      await fetch(`${BACKEND_URL}/api/creator/stories/${storyId}/retry`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID }),
      });
      // Set back to processing in UI so polling kicks in
      setStories(prev =>
        prev.map(s =>
          s.id === storyId ? { ...s, status: 'PROCESSING' } : s
        )
      );
    } catch {
      // ignore
    } finally {
      setRetryingId(null);
    }
  };

  // ── Download audio ───────────────────────
const handleDownload = async (
  e: React.MouseEvent,
  story: CreatorStory
) => {
  e.preventDefault();
  e.stopPropagation();

  if (!story.audioUrl) return;

  try {
    const response = await fetch(story.audioUrl);
    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;

    // filename
    a.download = `${story.title.replace(/\s+/g, '-').toLowerCase()}.mp3`;

    document.body.appendChild(a);
    a.click();

    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
  }
};

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <div className="w-full max-w-6xl mx-auto px-6 lg:px-8 pt-32 pb-32">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-8">
        <div>
          <div className="inline-flex items-center gap-2 mb-6 text-emerald-800 font-bold text-[11px] uppercase tracking-[0.2em] bg-emerald-950/20 px-4 py-2 rounded-full border border-emerald-900/40">
            <Library className="w-3.5 h-3.5 text-emerald-600" /> Sunkar Collection
          </div>
          <h1 className="text-5xl lg:text-7xl font-sans font-medium tracking-tight leading-[1.1]">
            <span className="text-emerald-800">Your audio </span>
            <br className="hidden lg:block" />
            <span className="text-white drop-shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              library.
            </span>
          </h1>
        </div>
        <p className="text-white/50 font-normal text-[15px] lg:text-right max-w-[280px] leading-relaxed">
          Your personal collection of human-like audio narratives, ready for effortless listening anytime.
        </p>
      </div>

      {/* Loading state - Premium Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="group relative bg-[#010603] border border-emerald-950/60 rounded-[2rem] p-8 flex flex-col md:flex-row gap-8 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/5 via-transparent to-transparent animate-pulse" />
              <div className="flex flex-col justify-between w-full md:w-auto md:min-w-[140px] shrink-0 gap-6 z-10">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/40 animate-pulse" />
                <div className="w-full h-8 bg-emerald-950/40 rounded-xl animate-pulse mt-4" />
                <div className="w-full h-8 bg-emerald-950/40 rounded-xl animate-pulse" />
              </div>
              <div className="flex-1 space-y-4 relative z-10">
                <div className="w-3/4 h-8 bg-emerald-950/50 rounded-lg animate-pulse" />
                <div className="w-1/2 h-4 bg-emerald-950/30 rounded-full animate-pulse" />
                <div className="w-1/3 h-4 bg-emerald-950/30 rounded-full animate-pulse" />
                <div className="pt-8 mt-auto flex items-center justify-between">
                  <div className="w-24 h-4 bg-emerald-950/40 rounded-full animate-pulse" />
                  <div className="w-14 h-14 bg-emerald-950/30 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="w-16 h-16 rounded-full bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-center">
            <Headphones className="w-7 h-7 text-emerald-900" />
          </div>
          <p className="text-emerald-900 text-sm font-bold tracking-widest uppercase">
            No stories yet
          </p>
          <Link
            href="/submit"
            className="px-8 py-3 bg-emerald-950/20 text-emerald-500 hover:text-white hover:bg-emerald-900/50 border border-emerald-900/50 rounded-full font-bold tracking-widest uppercase text-xs transition-all"
          >
            Create Your First Story
          </Link>
        </div>
          ) : (
        <>
          {/* Stories grid */}
          {!loading && stories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
       {stories.map(story => (
  <Link
    key={story.id}
    href={`/story/${story.id}`}
    className="group flex flex-col h-full bg-[#000502] border border-emerald-950 hover:border-emerald-900/50 rounded-[2.5rem] p-8 lg:p-12 transition-all duration-500 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.05)] hover:-translate-y-2 relative overflow-hidden"
  >
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-950/20 blur-[150px] transition-colors pointer-events-none rounded-full" />

              {/* Top row — meta + actions */}
              <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="flex flex-col gap-2.5">
                  <StatusBadge status={story.status} />
                  <span className="text-emerald-900 text-[10px] font-bold tracking-[0.2em] uppercase flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {formatDate(story.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Retry button — only for failed stories */}
                  {story.status === 'FAILED' && (
                    <button
                     onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     handleRetry(story.id);
                    }}
                      disabled={retryingId === story.id}
                      className="p-3 bg-black hover:bg-amber-950/20 text-emerald-800 hover:text-amber-500 rounded-2xl border border-emerald-900/30 transition-all disabled:opacity-40"
                      title="Retry audio generation"
                    >
                      {retryingId === story.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <RefreshCw className="w-4 h-4" />
                      }
                    </button>
                  )}

                  {/* Publish / Unpublish — only for ready stories */}
                  {story.status === 'READY' && (
                    <button
                      onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTogglePublish(story);
                    }}
                      disabled={publishingId === story.id}
                      className={`p-3 rounded-2xl border transition-all disabled:opacity-40 ${
                        story.isPublished
                          ? 'bg-emerald-950/20 text-emerald-500 border-emerald-900/50 hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/50'
                          : 'bg-black text-emerald-800 border-emerald-900/30 hover:bg-emerald-950/20 hover:text-emerald-500'
                      }`}
                      title={story.isPublished ? 'Unpublish' : 'Publish to home page'}
                    >
                      {publishingId === story.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : story.isPublished
                          ? <EyeOff className="w-4 h-4" />
                          : <Globe className="w-4 h-4" />
                      }
                    </button>
                  )}

                  {/* Edit — links story detail page */}
                  <Link href={`/story/${story.id}`}>
                    <button onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                   }} 
                  className="p-3 bg-black hover:bg-emerald-950/20 text-emerald-800 hover:text-emerald-400 rounded-2xl border border-emerald-900/30 transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </Link>

                  {/* Delete */}
                  <button
                    onClick={(e) =>{
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(story.id);
                      }}

                    disabled={deletingId === story.id}
                    className="p-3 bg-black hover:bg-red-950/40 text-emerald-800 hover:text-red-500 rounded-2xl border border-emerald-900/30 transition-all disabled:opacity-40"
                  >
                    {deletingId === story.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>

                  {/* Download audio */}
{story.status === 'READY' && story.audioUrl && (
  <button
    onClick={(e) => handleDownload(e, story)}
    className="p-3 bg-black hover:bg-emerald-950/20 text-emerald-800 hover:text-emerald-400 rounded-2xl border border-emerald-900/30 transition-all"
    title="Download Audio"
  >
    <Download className="w-4 h-4" />
  </button>
)}
                </div>
              </div>

              {/* Story title + meta */}
              <div className="flex-1 space-y-5 relative z-10">
                <h3 className="text-3xl font-medium text-emerald-600 tracking-tight group-hover:text-white transition-all duration-500 pb-1">
                  {story.title}
                </h3>
                <div className="flex flex-col gap-2">
                  {story.mood && (
                    <p className="text-white/40 text-[13px]">
                      Tone: <span className="text-white/60">{story.mood}</span>
                    </p>
                  )}
                  <p className="text-white/40 text-[13px]">
                    Voice: <span className="text-white/60">{VOICE_LABELS[story.voiceModel] || story.voiceModel}</span>
                  </p>
                  {story.isPublished && (
                    <p className="text-emerald-700 text-[11px] font-bold tracking-widest uppercase flex items-center gap-1.5">
                      <Globe className="w-3 h-3" /> Published
                    </p>
                  )}
                  {story.status === 'FAILED' && story.errorLogs && (
                    <div className="mt-4 p-4 bg-red-950/20 border border-red-900/30 rounded-xl">
                      <p className="text-red-400 text-[11px] font-bold tracking-widest uppercase mb-1">Error Log</p>
                      <p className="text-red-300/80 text-xs leading-relaxed font-mono">{story.errorLogs}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom row — play button */}
              <div className="pt-12 mt-auto flex items-center justify-between relative z-10">
                <span className="text-emerald-900 group-hover:text-emerald-600 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors flex items-center gap-2">
                  <Headphones className="w-3.5 h-3.5" />
                  {story.status === 'PROCESSING' && 'Generating...'}
                  {story.status === 'FAILED'     && 'Audio failed'}
                  {story.status === 'READY'      && 'Ready to play'}
                </span>

                {/* Play button — only clickable when audio is ready */}
                <Link href={`/story/${story.id}`}>
                  <button
                    disabled={story.status !== 'READY'}
                    className="flex items-center justify-center w-14 h-14 bg-emerald-950/20 hover:bg-emerald-900/50 text-emerald-500 hover:text-white rounded-full transition-all group-hover:scale-105 border border-emerald-900/50 shadow-[0_5px_15px_rgba(16,185,129,0.1)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-emerald-950/20 disabled:hover:text-emerald-500 disabled:group-hover:scale-100"
                  >
                    {story.status === 'PROCESSING'
                      ? <Loader2 className="w-5 h-5 animate-spin" />
                      : <Play className="w-5 h-5 ml-1" fill="currentColor" />
                    }
                  </button>
                </Link>
              </div>
           </Link>
          ))}
        </div>
        )}
      </>
    )}
  </div>
  );
}
