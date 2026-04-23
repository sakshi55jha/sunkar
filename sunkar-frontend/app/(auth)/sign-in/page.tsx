'use client';

import { useSignIn } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Layers, Eye, EyeOff, ArrowRight, Loader2, LogIn } from 'lucide-react';

type ClerkErrorLike = {
  errors?: Array<{ message?: string }>;
};

const getClerkErrorMessage = (err: unknown, fallback: string) => {
  const message = (err as ClerkErrorLike)?.errors?.[0]?.message;
  return message || fallback;
};

export default function SignInPage() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/auth-redirect');
      } else {
        // This handles cases like MFA where status is not complete
        console.log(result);
        setError('Additional verification required. (MFA not supported in this custom UI yet)');
      }
    } catch (err: unknown) {
      setError(getClerkErrorMessage(err, 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn) {
      setError('Authentication is still loading. Please try again in a moment.');
      return;
    }
    setError('');
    setLoading(true);
    // If they sign in with Google but are actually a new user, they might get dropped in /auth-redirect without a role.
    // Setting a fallback role to 'user' just in case, though they will be prompted to pick one.
    if (typeof window !== 'undefined') localStorage.setItem('sunkar_requested_role', 'user');

    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/auth-redirect"
      });
    } catch (err: unknown) {
      setError(getClerkErrorMessage(err, 'Google sign in failed'));
      setLoading(false);
    }
  };

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
              <LogIn className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-white">Welcome Back</h2>
              <p className="text-white/30 text-xs">Sign in to continue</p>
            </div>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
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
                required
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
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-black/60 border border-emerald-950 focus:border-emerald-700/50 px-4 py-3.5 pr-12 text-white placeholder-emerald-950/60 rounded-xl outline-none transition-all text-sm"
                  required
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
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-black font-bold tracking-widest uppercase text-sm rounded-2xl transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>Sign In <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <div className="my-6 flex items-center justify-center gap-4">
            <div className="h-px bg-emerald-900/50 flex-1" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-800">Or</span>
            <div className="h-px bg-emerald-900/50 flex-1" />
          </div>

          <button
            onClick={() => void handleGoogleSignIn()}
            disabled={loading || !isLoaded}
            className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-emerald-900/30 text-white text-sm rounded-2xl transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="mt-6 pt-6 border-t border-emerald-950 flex flex-col items-center justify-center gap-3 text-xs text-white/30">
            <p>Don&apos;t have an account?</p>
            <div className="flex items-center gap-4">
              <Link href="/sign-up-listener" className="text-emerald-500 hover:text-emerald-400 font-bold transition-colors">
                Sign up as Listener
              </Link>
              <span className="w-1 h-1 rounded-full bg-emerald-900" />
              <Link href="/sign-up-creator" className="text-emerald-500 hover:text-emerald-400 font-bold transition-colors">
                Sign up as Creator
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-white/20 hover:text-white/40 transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}