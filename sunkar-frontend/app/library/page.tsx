import { Library, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function ListenerLibrary() {
  return (
    <div className="w-full max-w-5xl mx-auto px-6 lg:px-12 pt-32 pb-32 flex flex-col items-center relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-950/20 blur-[200px] pointer-events-none rounded-full" />
      
      <div className="flex flex-col items-center justify-center py-32 gap-6 relative z-10 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.05)]">
          <Library className="w-10 h-10 text-emerald-600" />
        </div>
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-900/40 bg-emerald-950/20 text-[11px] font-bold tracking-widest uppercase mb-4 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <Sparkles className="w-3.5 h-3.5" /> Coming Soon
        </div>

        <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-4">
          <span className="text-white">Your Personal</span>{' '}
          <span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            Library
          </span>
        </h1>
        
        <p className="text-white/50 text-lg max-w-xl leading-relaxed mb-8">
          We are currently crafting a space for you to save, like, and organize your favorite audio stories. This feature will be available soon!
        </p>

        <Link
          href="/home"
          className="px-10 py-4 bg-emerald-950/20 text-emerald-500 hover:text-white hover:bg-emerald-900/50 border border-emerald-900/50 rounded-full font-bold tracking-widest uppercase text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.05)]"
        >
          Discover Stories
        </Link>
      </div>
    </div>
  );
}
