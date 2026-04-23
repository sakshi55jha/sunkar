'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';

import { Suspense } from 'react';

function SSOCallbackContent() {
  return (
    <div className="min-h-screen bg-[#000502] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-emerald-800 text-xs font-bold tracking-widest uppercase">
          Authenticating...
        </p>
      </div>
      <AuthenticateWithRedirectCallback 
        signInFallbackRedirectUrl="/auth-redirect"
        signUpFallbackRedirectUrl="/auth-redirect"
        signInForceRedirectUrl="/auth-redirect"
        signUpForceRedirectUrl="/auth-redirect"
      />
    </div>
  );
}

export default function SSOCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#000502] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    }>
      <SSOCallbackContent />
    </Suspense>
  );
}
