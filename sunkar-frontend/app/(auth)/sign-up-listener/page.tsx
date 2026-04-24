'use client';

import { useSignIn, useSignUp, useClerk } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Layers, Headphones, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

type ClerkErrorLike = {
  errors?: Array<{ message?: string }>;
};

const getClerkErrorMessage = (err: unknown, fallback: string) => {
  console.error("FULL CLERK ERROR:", err);
  if (err instanceof Error) return err.message;
  const message = (err as ClerkErrorLike)?.errors?.[0]?.message;
  return message || fallback;
};

export default function SignUpListener() {
 const { isLoaded, signUp } = useSignUp();
const { signIn, isLoaded: isSignInLoaded } = useSignIn();
const { setActive, loaded, client } = useClerk();
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000';

  // console.log("signUp:", signUp);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');


  const handleSignUp = async () => {
    if (!signUp) {
      setError("Clerk is still loading");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
        unsafeMetadata: { role: "user" },
      });

      if (typeof signUp.prepareEmailAddressVerification === 'function') {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      } else if (typeof signUp.prepareVerification === 'function') {
        await signUp.prepareVerification({ strategy: 'email_code' });
      } else if (typeof (signUp as any).verifications?.sendEmailCode === 'function') {
        await (signUp as any).verifications.sendEmailCode({ strategy: 'email_code' });
      } else {
        console.error("signUp object keys:", Object.keys(signUp));
        throw new Error("Clerk SDK error: No email verification method found on signUp");
      }
      setVerifying(true);
    } catch (err: unknown) {
      setError(getClerkErrorMessage(err, 'Signup failed'));
    } finally {
      setLoading(false);
    }
  };

  // const clerk = useClerk();

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);
    if (typeof window !== 'undefined') localStorage.setItem('sunkar_requested_role', 'user');

    try {
      if (!loaded || !client) {
        throw new Error('Authentication is still loading. Please try again in a moment.');
      }

      await client.signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/auth-redirect"
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('Authentication is still loading')) {
        setError(err.message);
      } else {
        setError(getClerkErrorMessage(err, 'Google sign up failed'));
      }
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!signUp) return;
    setLoading(true);
    setError('');

    try {
      let result: any;
      if (typeof signUp.attemptEmailAddressVerification === 'function') {
        result = await signUp.attemptEmailAddressVerification({ code });
      } else if (typeof signUp.attemptVerification === 'function') {
        result = await signUp.attemptVerification({ strategy: 'email_code', code });
      } else if (typeof (signUp as any).verifications?.verifyEmailCode === 'function') {
        result = await (signUp as any).verifications.verifyEmailCode({ code });
      } else {
        throw new Error("Clerk SDK error: No verify code method found on signUp");
      }

      const finalStatus = result.status || signUp.status;
      const finalSessionId = result.createdSessionId || signUp.createdSessionId;
      const finalUserId = result.createdUserId || signUp.createdUserId;
  
      
      if (finalStatus === 'complete') {
          // Sync user to DB
           await setActive({ session: finalSessionId });
        try {
          const res = await fetch(`${backendUrl}/api/users/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: finalUserId,
              email: email,
              name: `${firstName} ${lastName}`.trim(),
              role: 'user',
            }),
          });
          if (!res.ok) {
            const errorText = await res.text();
            alert(`Backend Sync Error: ${errorText}. Check backend terminal!`);
          }
        } catch (err) {
          console.error("Failed to sync user to DB", err);
          alert(`Network error: Could not reach backend at ${backendUrl}. Is it running?`);
        }


      

        router.push('/home');
      }
    } catch (err: any) {
      console.error("VERIFY ERROR:", err);
      setError(err?.errors?.[0]?.message || err?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Verification Screen ───────────────────────────
  if (verifying) {
    return (
      <div className="min-h-screen bg-[#000502] flex items-center justify-center px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-950/20 blur-[200px] pointer-events-none rounded-full" />

        <div className="relative z-10 w-full max-w-md">
          <div className="flex items-center gap-2 justify-center mb-10">
            <Layers className="w-5 h-5 text-emerald-500" />
            <span className="text-xl font-bold tracking-tight text-white">sunkar</span>
          </div>

          <div className="bg-[#010603] border border-emerald-950 rounded-[2rem] p-8">
            <h2 className="text-2xl font-medium text-white mb-2">Check your email</h2>
            <p className="text-white/40 text-sm mb-8">
              We sent a verification code to <span className="text-emerald-500">{email}</span>
            </p>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter verification code"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full bg-black/60 border border-emerald-950 focus:border-emerald-700/50 px-5 py-4 text-white placeholder-emerald-950 rounded-2xl outline-none transition-all text-center text-2xl tracking-[0.5em] font-mono"
                maxLength={6}
              />

              {error && (
                <p className="text-red-400 text-xs text-center">{error}</p>
              )}

              <button
                onClick={handleVerify}
                disabled={loading || code.length < 6}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-black font-bold tracking-widest uppercase text-sm rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Sign Up Form ──────────────────────────────────
  return (
    <div className="min-h-screen bg-[#000502] flex items-center justify-center px-6 py-12">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-950/20 blur-[200px] pointer-events-none rounded-full" />

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-10">
          <Layers className="w-5 h-5 text-emerald-500" />
          <span className="text-xl font-bold tracking-tight text-white">sunkar</span>
        </div>

        <div className="bg-[#010603] border border-emerald-900/50 rounded-[2rem] p-8 shadow-[0_0_40px_rgba(16,185,129,0.05)]">

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/30 border border-emerald-700/40 flex items-center justify-center">
              <Headphones className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-white">Listener Account</h2>
              <p className="text-white/30 text-xs">Discover immersive audio stories</p>
            </div>
          </div>

          <div className="space-y-4">

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold tracking-widest uppercase text-emerald-800 mb-2 block">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="Sneha"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full bg-black/60 border border-emerald-950 focus:border-emerald-700/50 px-4 py-3.5 text-white placeholder-emerald-950/60 rounded-xl outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold tracking-widest uppercase text-emerald-800 mb-2 block">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Jha"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full bg-black/60 border border-emerald-950 focus:border-emerald-700/50 px-4 py-3.5 text-white placeholder-emerald-950/60 rounded-xl outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-[10px] font-bold tracking-widest uppercase text-emerald-800 mb-2 block">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-black/60 border border-emerald-950 focus:border-emerald-700/50 px-4 py-3.5 text-white placeholder-emerald-950/60 rounded-xl outline-none transition-all text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-[10px] font-bold tracking-widest uppercase text-emerald-800 mb-2 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-black/60 border border-emerald-950 focus:border-emerald-700/50 px-4 py-3.5 pr-12 text-white placeholder-emerald-950/60 rounded-xl outline-none transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-900 hover:text-emerald-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs">{error}</p>
            )}

            <button
              onClick={handleSignUp}
              disabled={loading || !email || !password || !firstName}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-black font-bold tracking-widest uppercase text-sm rounded-2xl transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>Create Listener Account <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </div>

          <div className="my-6 flex items-center justify-center gap-4">
            <div className="h-px bg-emerald-900/50 flex-1" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-800">Or</span>
            <div className="h-px bg-emerald-900/50 flex-1" />
          </div>

          <button
            onClick={() => void handleGoogleSignUp()}
            disabled={loading || !loaded}
            className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-emerald-900/30 text-white text-sm rounded-2xl transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </button>

          <div className="mt-6 pt-6 border-t border-emerald-950 flex items-center justify-center gap-2 text-xs text-white/30">
            Already have an account?
            <Link href="/sign-in" className="text-emerald-500 hover:text-emerald-400 font-bold transition-colors">
              Sign in
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-xs text-white/20 hover:text-white/40 transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
