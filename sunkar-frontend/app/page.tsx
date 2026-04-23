'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Headphones, Mic2, ArrowRight, Layers } from 'lucide-react';

export default function LandingPage() {
  const { user, isLoaded } = useUser();

  return (
    <div className="min-h-screen bg-[#000502] text-white overflow-hidden selection:bg-emerald-800/80 selection:text-white">

      {/* ── Ambient background glow ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-950/30 blur-[200px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-900/10 blur-[200px] rounded-full" />
      </div>

      {/* ── Hero Section ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-32">
        <div className="flex flex-col items-center text-center mb-20">

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-900/40 bg-emerald-950/20 text-[11px] font-bold tracking-widest uppercase mb-8 text-emerald-500">
            <Layers className="w-3.5 h-3.5" /> Next-Gen Audio Platform
          </div>

          <h1 className="text-6xl md:text-8xl font-medium tracking-tight leading-[1.05] mb-8 max-w-4xl">
            <span className="text-white">Stories meant</span>
            <br />
            <span className="text-emerald-500 drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              to be heard.
            </span>
          </h1>

          <p className="text-white/50 text-lg max-w-xl leading-relaxed mb-12">
            Discover immersive audio stories narrated by AI voices that feel
            genuinely human. Or create your own and share it with the world.
          </p>

          {/* ── Main CTA ── */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {isLoaded && user ? (
              <Link href="/auth-redirect">
                <button className="group flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-black font-bold tracking-widest uppercase text-sm rounded-full transition-all active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  Continue to App
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            ) : (
              <Link href="/sign-in">
                <button
                  className="group flex items-center gap-3 px-8 py-4 bg-emerald-950/40 hover:bg-emerald-900/60 text-white border border-emerald-900/50 font-bold tracking-widest uppercase text-sm rounded-full transition-all active:scale-95"
                >
                  Already have an account? Sign In
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* ── Role Selection Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          
          {/* Listener Card */}
          <div className="group relative p-8 bg-[#010603] border border-emerald-950 hover:border-emerald-800/50 rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-1 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-950/20 blur-[100px] pointer-events-none rounded-full" />

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/40 border border-emerald-900/40 flex items-center justify-center mb-6">
                <Headphones className="w-5 h-5 text-emerald-500" />
              </div>

              <h3 className="text-2xl font-medium text-white mb-3 tracking-tight">
                For Listeners
              </h3>
              <p className="text-white/40 text-sm leading-relaxed mb-8">
                Explore a growing library of immersive audio stories. Curated moods,
                real emotions, incredibly natural voices.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  'Browse stories by mood and genre',
                  'Stream instantly — no downloads',
                  'New stories added daily',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative z-10 mt-auto">
              {(!isLoaded || !user) && (
                <Link href="/sign-up-listener">
                  <button className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-emerald-950/30 hover:bg-emerald-900/50 text-white text-xs font-bold tracking-widest uppercase border border-emerald-900/50 hover:border-emerald-600/50 rounded-2xl transition-all">
                    Sign up to Listen
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Creator Card */}
          <div className="group relative p-8 bg-[#010603] border border-emerald-900/50 hover:border-emerald-600/50 rounded-[2rem] overflow-hidden transition-all duration-500 hover:-translate-y-1 shadow-[0_0_40px_rgba(16,185,129,0.05)] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-900/15 blur-[100px] pointer-events-none rounded-full" />
            <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-900/30 border border-emerald-700/40 rounded-full text-[10px] font-bold tracking-widest uppercase text-emerald-500">
              Creator
            </div>

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-900/30 border border-emerald-700/40 flex items-center justify-center mb-6">
                <Mic2 className="w-5 h-5 text-emerald-400" />
              </div>

              <h3 className="text-2xl font-medium text-white mb-3 tracking-tight">
                For Creators
              </h3>
              <p className="text-white/40 text-sm leading-relaxed mb-8">
                Write your story, choose a voice, and let our AI bring it to life.
                Publish to the world in minutes.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  'AI-powered voice narration',
                  'Optional AI story enhancement',
                  'Publish & manage your library',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative z-10 mt-auto">
              {(!isLoaded || !user) && (
                <Link href="/sign-up-creator">
                  <button className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-black font-bold tracking-widest uppercase text-sm rounded-2xl transition-all active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    Become a Creator
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              )}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}