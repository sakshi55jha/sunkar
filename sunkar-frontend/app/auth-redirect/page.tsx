'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthRedirect() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const role = user.publicMetadata?.role as string;

    if (role === 'creator') {
      router.push('/dashboard');
    } else {
      router.push('/home');
    }
  }, [isLoaded, user]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#000502]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-emerald-800 text-xs font-bold tracking-widest uppercase">
          Loading your experience...
        </p>
      </div>
    </div>
  );
}