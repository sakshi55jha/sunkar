'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, LogIn, LayoutDashboard, PenTool, Library, Headphones } from 'lucide-react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const role = user?.unsafeMetadata?.role || user?.publicMetadata?.role;
  const isCreator = role === 'creator';
  const isListener = role === 'user' || role === 'listener';

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-black/80 backdrop-blur-2xl border-b border-emerald-900/30 shadow-[0_4px_30px_rgba(16,185,129,0.05)] py-4' 
        : 'bg-transparent py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-emerald-950/40 border border-emerald-900/40 flex items-center justify-center group-hover:bg-emerald-900/40 group-hover:border-emerald-500/40 transition-all">
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
            sunkar
          </span>
        </Link>
        
        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink href="/" text="HOME" active={pathname === '/'} />

          {isLoaded && user && isCreator && (
            <>
              <NavLink href="/dashboard" text="DASHBOARD" icon={<LayoutDashboard className="w-3.5 h-3.5" />} active={pathname === '/dashboard'} />
              <NavLink href="/create" text="CREATE" icon={<PenTool className="w-3.5 h-3.5" />} active={pathname === '/create'} />
              <NavLink href="/submit-story" text="SUBMIT" active={pathname === '/submit-story'} />
            </>
          )}

          {isLoaded && user && isListener && (
            <>
              <NavLink href="/home" text="DISCOVER" active={pathname === '/home'} />
              <NavLink href="/your-story" text="LIBRARY" icon={<Library className="w-3.5 h-3.5" />} active={pathname === '/your-story'} />
            </>
          )}
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          {!isLoaded ? (
            <div className="w-24 h-9 bg-emerald-950/20 animate-pulse rounded-full" />
          ) : !user ? (
            <div className="flex items-center gap-3">
              <Link 
                href="/sign-in"
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold tracking-widest uppercase text-emerald-400 hover:text-white transition-colors"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {isCreator && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/30 border border-emerald-900/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-500">Creator Mode</span>
                </div>
              )}
              {isListener && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/30 border border-emerald-900/50">
                  <Headphones className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-500">Listener</span>
                </div>
              )}
              <div className="pl-2 border-l border-emerald-900/30">
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-9 h-9 ring-2 ring-emerald-900/50 hover:ring-emerald-500/50 transition-all"
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}

function NavLink({ href, text, icon, active }: { href: string; text: string; icon?: React.ReactNode; active?: boolean }) {
  return (
    <Link 
      href={href} 
      className={`group flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase transition-all duration-300 ${
        active 
          ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]' 
          : 'text-white/50 hover:text-white'
      }`}
    >
      {icon && <span className={`transition-colors ${active ? 'text-emerald-400' : 'text-emerald-600 group-hover:text-emerald-400'}`}>{icon}</span>}
      {text}
    </Link>
  );
}