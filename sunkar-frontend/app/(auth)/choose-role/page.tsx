'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Headphones, Mic2, Loader2 } from 'lucide-react';

export default function ChooseRole() {
  const { user } = useUser();
  const router   = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000';

  const handleSelectRole = async (role: 'user' | 'creator') => {
    if (!user) return;
    setLoading(role);

    // Save role to Clerk unsafe metadata (publicMetadata cannot be updated from client)
    await user.update({
      unsafeMetadata: { role },
    });

    // Sync user data to our backend database
    try {
      await fetch(`${backendUrl}/api/users/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName || user.firstName,
          imageUrl: user.imageUrl,
          role: role,
        }),
      });
    } catch (err) {
      console.error("Failed to sync user to backend", err);
    }

    if (role === 'creator') {
      router.push('/dashboard');
    } else {
      router.push('/home');
    }
  };

  return (
    <div className="min-h-screen bg-[#000502] flex items-center justify-center px-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-950/20 blur-[200px] pointer-events-none rounded-full" />

      <div className="relative z-10 w-full max-w-xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-medium text-white mb-3 tracking-tight">
            How will you use Sunkar?
          </h1>
          <p className="text-white/40 text-sm">
            Choose your experience. You can only pick one.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Listener */}
          <button
            onClick={() => handleSelectRole('user')}
            disabled={!!loading}
            className="group relative p-8 bg-[#010603] border border-emerald-950 hover:border-emerald-800/50 rounded-[2rem] text-left transition-all duration-300 hover:-translate-y-1 disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/40 border border-emerald-900/40 flex items-center justify-center mb-5">
              {loading === 'user'
                ? <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                : <Headphones className="w-5 h-5 text-emerald-500" />
              }
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Listener</h3>
            <p className="text-white/40 text-sm leading-relaxed">
              Discover and enjoy immersive audio stories from creators worldwide.
            </p>
          </button>

          {/* Creator */}
          <button
            onClick={() => handleSelectRole('creator')}
            disabled={!!loading}
            className="group relative p-8 bg-[#010603] border border-emerald-900/50 hover:border-emerald-600/50 rounded-[2rem] text-left transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 shadow-[0_0_30px_rgba(16,185,129,0.05)]"
          >
            <div className="absolute top-4 right-4 px-2.5 py-1 bg-emerald-900/30 border border-emerald-700/40 rounded-full text-[10px] font-bold tracking-widest uppercase text-emerald-500">
              Creator
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/30 border border-emerald-700/40 flex items-center justify-center mb-5">
              {loading === 'creator'
                ? <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                : <Mic2 className="w-5 h-5 text-emerald-400" />
              }
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Creator</h3>
            <p className="text-white/40 text-sm leading-relaxed">
              Write stories, generate AI audio, and publish to the world.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}