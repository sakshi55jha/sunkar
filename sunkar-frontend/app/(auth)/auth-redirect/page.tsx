'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function AuthRedirectContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isUpdating, setIsUpdating] = useState(false);
  const hasHandled = useRef(false);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000';

  useEffect(() => {
    if (!isLoaded || !user || hasHandled.current) return;
    hasHandled.current = true;

    const role = (user.unsafeMetadata?.role || user.publicMetadata?.role) as string;
    let requestedRole = searchParams.get('role');
    
    // Clerk strips query params on OAuth redirect, so we fallback to localStorage
    if (!requestedRole && typeof window !== 'undefined') {
      requestedRole = localStorage.getItem('sunkar_requested_role');
    }

    const handleRole = async () => {
      let finalRole = role;

      if (!role && requestedRole) {
        setIsUpdating(true);
        try {
          await user.update({ unsafeMetadata: { role: requestedRole } });
          finalRole = requestedRole;
          if (typeof window !== 'undefined') localStorage.removeItem('sunkar_requested_role');
        } catch (e) {
          console.error("Failed to update role", e);
          router.push('/choose-role');
          return;
        }
      }

      try {
        const response = await fetch(`${backendUrl}/api/users/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            name: user.fullName || user.firstName,
            imageUrl: user.imageUrl,
            role: finalRole || 'user', // Default to 'user' if none is set so DB accepts it
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Backend returned an error during sync", errorText);
          alert(`Backend Sync Error: ${errorText}. Check backend terminal!`);
        } else {
          console.log("Successfully synced user to backend!");
        }
      } catch (err) {
        console.error("Network error syncing user to backend. Is backend running?", err);
        alert(`Network error: Could not reach backend at ${backendUrl}. Is it running?`);
      }

      if (finalRole === 'creator') {
        router.push('/dashboard');
      } else if (finalRole === 'user' || finalRole === 'listener') {
        router.push('/home');
      } else {
        router.push('/choose-role');
      }
    };

    handleRole();
  }, [isLoaded, user, router, searchParams, backendUrl]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#000502]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-emerald-800 text-xs font-bold tracking-widest uppercase">
          {isUpdating ? 'Setting up your account...' : 'Loading...'}
        </p>
      </div>
    </div>
  );
}

export default function AuthRedirect() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#000502]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    }>
      <AuthRedirectContent />
    </Suspense>
  );
}