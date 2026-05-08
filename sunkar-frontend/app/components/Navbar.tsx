'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, LogIn, LayoutDashboard, PenTool, Library, Headphones, Menu, X } from 'lucide-react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  if (pathname === '/') return null;

  return (
    <>
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-[#000502]/95 backdrop-blur-md border-b border-emerald-950 py-4' 
        : 'bg-transparent border-b border-transparent py-6'
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
              <NavLink href="/your-story" text="DASHBOARD" icon={<LayoutDashboard className="w-3.5 h-3.5" />} active={pathname === '/your-story'} />
              <NavLink href="/create" text="CREATE" icon={<PenTool className="w-3.5 h-3.5" />} active={pathname === '/create'} />
              <NavLink href="/submit-story" text="SUBMIT" active={pathname === '/submit-story'} />
            </>
          )}

          {isLoaded && user && isListener && (
            <>
              <NavLink href="/home" text="DISCOVER" active={pathname === '/home'} />
              <NavLink href="/library" text="LIBRARY" icon={<Library className="w-3.5 h-3.5" />} active={pathname === '/library'} />
            </>
          )}
        </div>

        {/* Auth Buttons & Mobile Toggle */}
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
              <div className="pl-2 md:border-l border-emerald-900/30">
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

          {/* Mobile Menu Toggle Button */}
          {user && (
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -mr-2 text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </nav>
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-72 bg-black border-r border-emerald-900/50 shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-10">
            <span className="text-sm font-bold tracking-[0.2em] uppercase text-emerald-500">Navigation</span>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 -mr-2 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col gap-8 flex-1">
            <MobileNavLink href="/" text="HOME" active={pathname === '/'} />

            {isLoaded && user && isCreator && (
              <>
                <MobileNavLink href="/your-story" text="DASHBOARD" icon={<LayoutDashboard className="w-4 h-4" />} active={pathname === '/your-story'} />
                <MobileNavLink href="/create" text="CREATE" icon={<PenTool className="w-4 h-4" />} active={pathname === '/create'} />
                <MobileNavLink href="/submit-story" text="SUBMIT" active={pathname === '/submit-story'} />
              </>
            )}

            {isLoaded && user && isListener && (
              <>
                <MobileNavLink href="/home" text="DISCOVER" active={pathname === '/home'} />
                <MobileNavLink href="/library" text="LIBRARY" icon={<Library className="w-4 h-4" />} active={pathname === '/library'} />
              </>
            )}
          </div>
          
          <div className="mt-auto pt-8 border-t border-emerald-900/30">
            <div className="flex items-center gap-4">
               {isCreator && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/30 border border-emerald-900/50">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold tracking-widest uppercase text-emerald-500">Creator Mode</span>
                </div>
              )}
              {isListener && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/30 border border-emerald-900/50">
                  <Headphones className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold tracking-widest uppercase text-emerald-500">Listener</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
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

function MobileNavLink({ href, text, icon, active }: { href: string; text: string; icon?: React.ReactNode; active?: boolean }) {
  return (
    <Link 
      href={href} 
      className={`group flex items-center gap-3 text-sm font-bold tracking-widest uppercase transition-all duration-300 ${
        active 
          ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)] translate-x-2' 
          : 'text-white/50 hover:text-white hover:translate-x-2'
      }`}
    >
      {icon && <span className={`transition-colors ${active ? 'text-emerald-400' : 'text-emerald-600 group-hover:text-emerald-400'}`}>{icon}</span>}
      {text}
    </Link>
  );
}