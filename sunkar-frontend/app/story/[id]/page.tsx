'use client'

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Fingerprint, Edit3, Trash2, ArrowUpRight, Loader2, Globe, EyeOff } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Fallback images indexed by story id character sum
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=1800',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1800',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1800',
];

interface Story {
  id:           string;
  title:        string;
  originalText: string;
  enhancedText: string | null;
  mood:         string | null;
  audioUrl:     string | null;
  status:       'PROCESSING' | 'READY' | 'FAILED';
  isPublished:  boolean;
  userId:       string;
  createdAt:    string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function StoryInfo({ params }: { params: { id: string } }) {
   const { user } = useUser();   // ✅ real logged-in user
  const userId = user?.id;

  const [story, setStory]           = useState<Story | null>(null);
  const [loading, setLoading]       = useState(true);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]     = useState(0);
  const [volume, setVolume]         = useState(1);
  const [publishing, setPublishing] = useState(false);

 const audioRef = useRef<HTMLAudioElement>(null);
  const pollRef  = useRef<NodeJS.Timeout | null>(null);
  
    // Fetch story on mount
  useEffect(() => {
    fetchStory();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [params.id]);

  // Poll for status updates while story is processing
  useEffect(() => {
    if (story?.status === 'PROCESSING') {
      pollRef.current = setInterval(fetchStory, 3000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
  }, [story?.status]);

  const fetchStory = async ()=>{
    try{
     const res = await fetch(`${BACKEND_URL}/api/creator/stories/${params.id}`);
     if(!res.ok) return;
     const data = await res.json();
     setStory(data);
    }catch{
   //ignore
    }finally{
      setLoading(false);
    }
  };

  // -- Audio Controls --
  const handlePlayPause = () =>{
    if(!audioRef.current) return;
    if(isPlaying){
      audioRef.current.pause();
    }else{
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>)=>{
    if(!audioRef.current) return;
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>)=>{
   if(!audioRef.current) return;
   const vol = Number(e.target.value);
   audioRef.current.volume = vol;
   setVolume(vol);
  }

  const skipForward = ()=>{
    if(!audioRef.current) return;
    audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 15, duration);
  }

  const skipBackward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 15, 0);
  };

  // -- Publish Toogle --
  const handleTogglePublish = async ()=>{
    if (!story || !userId) return;

    setPublishing(true);
    try{
   const res = await fetch(`${BACKEND_URL}/api/creator/stories/${story.id}/publish`, {
     method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !story.isPublished, userId: userId }),
    });
      const data = await res.json();
      setStory(prev => prev ? { ...prev, isPublished: data.isPublished } : prev);
  }
  catch {
      // ignore
    } finally {
      setPublishing(false);
    }
  };

  // -- Delete --
  const handleDelete = async () =>{
    if (!story || !userId || !confirm("Delete this story Permanently?")) return;
    await fetch(`${BACKEND_URL}/api/creator/stories/${story.id}`, {
      method : 'DELETE',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({userId: userId}),
    });
    window.location.href = '/dashboard';
  }

  const coverImage = story ? FALLBACK_IMAGES[story.id.charCodeAt(0) % FALLBACK_IMAGES.length]
    : FALLBACK_IMAGES[0];

      const displayText = story?.enhancedText || story?.originalText || '';

      // -- Loading --
       if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

   if (!story) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-emerald-900 text-sm font-bold tracking-widest uppercase">
          Story not found
        </p>
      </div>
    );
  }

  
  return (
    <div className="flex flex-col min-h-screen w-full mx-auto pb-48 bg-[#000502] relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-950/20 blur-[200px] pointer-events-none rounded-full" />
      
       {/* Hidden audio element */}
      {story.audioUrl && (
        <audio
          ref={audioRef}
          src={story.audioUrl}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Immersive Dark Cyber Header Image */}
      <div className="w-full h-[60vh] relative min-h-[500px]">
        <div className="absolute inset-0 z-0 bg-[#000502]">
          <img 
            src={coverImage}
            alt="Story Cover"
            className="w-full h-full object-cover opacity-30 mix-blend-overlay filter grayscale hue-rotate-[90deg]"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#000502] via-[#000502]/80 to-transparent z-10" />
        
        <div className="absolute bottom-0 left-0 right-0 z-20 max-w-5xl mx-auto px-6 lg:px-12 pb-16 flex flex-col justify-end h-full">
           <div className="inline-flex items-center gap-3 px-4 py-1.5 border border-emerald-900/40 rounded-full mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500 bg-emerald-950/20 w-fit backdrop-blur-md">
            {story.mood || 'story'}
          </div>
          <h1 className="text-5xl md:text-7xl font-sans font-medium text-white tracking-tight leading-[1.1] mb-8">
            {story.title}
          </h1>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800 border-b border-emerald-950 pb-6">
            <Fingerprint className="w-4 h-4 text-emerald-600" />
            <span>Sunkar Audio Engine</span>
             {/* Processing status badge */}
            {story.status === 'PROCESSING' && (
              <span className="flex items-center gap-2 text-amber-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                Generating audio...
              </span>
            )}
            {story.status === 'FAILED' && (
              <span className="text-red-600">Audio generation failed</span>
            )}
          </div>
        </div>
      </div>

      {/* Story Text */}
      <div className="flex-1 max-w-4xl mx-auto px-6 lg:px-12 w-full pt-16 relative z-30">
        <div className="prose prose-invert prose-lg md:prose-xl max-w-none text-white/70 leading-[2.1] font-normal text-[18px] selection:bg-emerald-900/40 selection:text-white">
        {story.enhancedText && (
            <p className="border-l-2 border-emerald-600 pl-6 mb-12 text-emerald-600 font-bold tracking-widest uppercase text-sm">
              Enhanced by AI
            </p>
          )}
            {
            story.status === 'PROCESSING' && !story.enhancedText && (
            <p className="border-l-2 border-emerald-600 pl-6 mb-12 text-emerald-600 font-bold tracking-widest uppercase text-sm">
              Preparing natural voice narration...
            </p>
          )}
          <p className="text-white transition-colors hover:text-emerald-100 first-letter:text-6xl first-letter:font-sans first-letter:text-emerald-500 first-letter:float-left first-letter:mr-6 first-letter:-mt-2 font-serif md:text-[22px]">
            {displayText}
          </p>
        </div>
        
        <div className="mt-24 pt-8 border-t border-emerald-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-950" />
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-800" />
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          </div>
          
          <div className="flex items-center gap-3">
       {/* Publish / Unpublish button — only show when audio is ready */}
       {
        story.status === 'READY' && story.userId === USER_ID && (
              <button
                onClick={handleTogglePublish}
                disabled={publishing}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold tracking-widest uppercase transition-all ${
                  story.isPublished
                    ? 'bg-emerald-950/20 text-emerald-500 border-emerald-900/50 hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/50'
                    : 'bg-emerald-950/20 text-emerald-800 border-emerald-900/40 hover:text-emerald-500 hover:border-emerald-900'
                }`}
              >
                 {publishing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : story.isPublished ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Globe className="w-3.5 h-3.5" />
                )}
                {story.isPublished ? 'Unpublish' : 'Publish'}
              </button>
        )}

         <button className="p-3 bg-black hover:bg-emerald-950/20 text-emerald-800 hover:text-emerald-500 rounded-xl border border-emerald-900/40 hover:border-emerald-900 transition-all">
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-3 bg-black hover:bg-red-950/20 text-emerald-800 hover:text-red-500 rounded-xl border border-emerald-900/40 hover:border-red-900/50 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Audio Player — only show when audio is ready */}
      {story.status === 'READY' && story.audioUrl && (
        <div className="fixed bottom-0 left-0 right-0 w-full bg-[#000502]/95 backdrop-blur-3xl border-t border-emerald-950 z-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-6">

            {/* Story info */}
            <div className="flex items-center gap-5 w-full md:w-3/12 shrink-0">
              <div className="w-12 h-12 bg-black border border-emerald-900/50 rounded-xl items-center justify-center hidden lg:flex shadow-inner">
                <ArrowUpRight className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex flex-col truncate">
                <span className="text-white font-medium text-xs tracking-wide truncate">{story.title}</span>
                <span className="text-emerald-800 font-bold text-[10px] mt-1.5 tracking-[0.2em] uppercase">Audio Sync</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center justify-center flex-1 w-full md:w-6/12 max-w-xl">
              <div className="flex items-center justify-center gap-8 mb-4">
                <button
                  onClick={skipBackward}
                  className="text-emerald-800 hover:text-emerald-500 transition-colors"
                >
                  <SkipBack className="w-4 h-4" fill="currentColor" />
                </button>
                <button
                  onClick={handlePlayPause}
                  className="w-14 h-14 flex items-center justify-center bg-emerald-950/20 text-emerald-500 hover:bg-emerald-900/50 hover:text-white hover:scale-110 transition-all rounded-full border border-emerald-900/50"
                >
                  {isPlaying
                    ? <Pause className="w-5 h-5" fill="currentColor" />
                    : <Play  className="w-5 h-5 ml-1" fill="currentColor" />
                  }
                </button>
                <button
                  onClick={skipForward}
                  className="text-emerald-800 hover:text-emerald-500 transition-colors"
                >
                  <SkipForward className="w-4 h-4" fill="currentColor" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="flex items-center w-full gap-4">
                <span className="text-[10px] text-emerald-900 font-bold tracking-[0.2em] w-12 text-right">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1 appearance-none bg-emerald-950 rounded-full cursor-pointer accent-emerald-500"
                />
                <span className="text-[10px] text-emerald-900 font-bold tracking-[0.2em] w-12 text-left">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Volume */}
            <div className="items-center justify-end gap-5 w-full md:w-3/12 shrink-0 hidden lg:flex">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-1 appearance-none bg-emerald-950 rounded-full cursor-pointer accent-emerald-500"
              />
              <Volume2 className="w-4 h-4 text-emerald-800" />
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
