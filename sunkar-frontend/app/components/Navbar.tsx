import Link from 'next/link';
import { Layers, LogIn } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-black/90 backdrop-blur-2xl border-b border-emerald-900/40 shadow-[0_4px_30px_rgba(16,185,129,0.1)]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
           <Layers className="w-5 h-5 text-emerald-600 group-hover:text-emerald-500 transition-colors" />
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-500 transition-colors">
            sunkar
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-10">
          <NavLink href="/" text="HOME" />
          <NavLink href="/create" text="CREATE" />
          <NavLink href="/submit-story" text="SUBMIT" />
          <NavLink href="/your-story" text="LIBRARY" />
        </div>

        <div>
           <button className="flex items-center gap-2 px-6 py-2 bg-emerald-950/20 hover:bg-emerald-900/40 text-white text-xs font-bold tracking-widest transition-all rounded-full active:scale-95 border border-emerald-900/50 hover:border-emerald-600/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <span>SIGN IN</span>
            <LogIn className="w-4 h-4 text-emerald-600 group-hover:text-emerald-400" /> 
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, text }: { href: string; text: string }) {
  return (
    <Link 
      href={href} 
      className="text-xs font-semibold tracking-widest text-emerald-100/50 hover:text-emerald-500 transition-all hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]"
    >
      {text}
    </Link>
  );
}
