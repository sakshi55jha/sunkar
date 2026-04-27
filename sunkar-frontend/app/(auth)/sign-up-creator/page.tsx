'use client';

import { useSignUp, useClerk } from '@clerk/nextjs';
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

export default function SignUpCreator() {
  const { signUp } = useSignUp();
  const { loaded, client, setActive } = useClerk();
  const router = useRouter();

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000';

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
    setError('');

    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
        unsafeMetadata: { role: 'creator' },
      });

      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });

      setVerifying(true);
    } catch (err: unknown) {
      setError(getClerkErrorMessage(err, 'Signup failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);

    if (typeof window !== 'undefined') {
      localStorage.setItem('sunkar_requested_role', 'creator');
    }

    try {
      if (!loaded || !client) {
        throw new Error('Authentication is still loading.');
      }

      await client.signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/auth-redirect',
      });
    } catch (err: unknown) {
      setError(getClerkErrorMessage(err, 'Google sign up failed'));
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!signUp) return;

    setLoading(true);
    setError('');

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status !== 'complete') {
        setError('Verification incomplete');
        return;
      }

      await setActive({ session: result.createdSessionId });

      try {
        await fetch(`${backendUrl}/api/users/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: result.createdUserId,
            email,
            name: `${firstName} ${lastName}`.trim(),
            role: 'creator',
          }),
        });
      } catch (err) {
        console.error("Failed to sync creator:", err);
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      setError(getClerkErrorMessage(err, 'Invalid verification code'));
    } finally {
      setLoading(false);
    }
  };

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
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-black/60 border border-emerald-950 focus:border-emerald-700/50 px-5 py-4 text-white placeholder-emerald-950 rounded-2xl outline-none transition-all text-center text-2xl tracking-[0.5em] font-mono"
                maxLength={6}
              />

              {error && <p className="text-red-400 text-xs text-center">{error}</p>}

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

  return (
    <div className="min-h-screen bg-[#000502] flex items-center justify-center px-6 py-12">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-950/20 blur-[200px] pointer-events-none rounded-full" />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-10">
          <Layers className="w-5 h-5 text-emerald-500" />
          <span className="text-xl font-bold tracking-tight text-white">sunkar</span>
        </div>

        <div className="bg-[#010603] border border-emerald-900/50 rounded-[2rem] p-8 shadow-[0_0_40px_rgba(16,185,129,0.05)]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/30 border border-emerald-700/40 flex items-center justify-center">
              <Headphones className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-white">Creator Account</h2>
              <p className="text-white/30 text-xs">Publish immersive audio stories</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-black/60 border border-emerald-950 px-4 py-3.5 text-white rounded-xl"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-black/60 border border-emerald-950 px-4 py-3.5 text-white rounded-xl"
              />
            </div>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/60 border border-emerald-950 px-4 py-3.5 text-white rounded-xl"
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/60 border border-emerald-950 px-4 py-3.5 pr-12 text-white rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-2xl flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Creator Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>

          <div className="my-6 flex items-center justify-center gap-4">
            <div className="h-px bg-emerald-900/50 flex-1" />
            <span className="text-[10px] font-bold uppercase text-emerald-800">Or</span>
            <div className="h-px bg-emerald-900/50 flex-1" />
          </div>

          <button
            onClick={() => void handleGoogleSignUp()}
            disabled={loading}
            className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-emerald-900/30 text-white text-sm rounded-2xl"
          >
            Sign up with Google
          </button>

          <div className="mt-6 pt-6 border-t border-emerald-950 text-center text-xs text-white/30">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-emerald-500 font-bold">
              Sign in
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-xs text-white/20 hover:text-white/40">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}