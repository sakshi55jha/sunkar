import { ArrowRight, Mic2, Waves } from 'lucide-react';

export default function SubmitStory() {
  return (
    <div className="w-full max-w-5xl mx-auto px-6 lg:px-12 pt-24 pb-32 flex flex-col items-center relative">
      
      <div className="flex flex-col items-center mb-20 text-center relative z-10 w-full">
        <h1 className="text-5xl md:text-6xl font-medium tracking-tight mb-8">
          <span className="text-white/40">Bring your writing</span> <br className="hidden md:block"/>
          <span className="text-white drop-shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            to life with audio
          </span>
        </h1>
        <p className="text-white/50 font-normal max-w-xl text-lg leading-relaxed">
          Submit your own story and let Sunkar’s AI transform it into a highly evocative, realistic listening experience.
        </p>
      </div>

      <div className="w-full bg-[#000502] border border-emerald-950 shadow-[0_20px_40px_-20px_rgba(16,185,129,0.05)] p-8 md:p-14 rounded-[3rem] relative z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-950/20 blur-[200px] pointer-events-none rounded-full" />
        
        <form className="space-y-12 relative z-10">
          
          <div className="space-y-4 group">
            <label htmlFor="title" className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800 flex items-center gap-3 transition-colors group-focus-within:text-emerald-500">
               Story Title
            </label>
            <input 
              id="title"
              type="text" 
              className="w-full bg-black/60 border-b border-emerald-950 px-6 py-5 text-white placeholder-emerald-950 focus:outline-none focus:border-emerald-600/50 transition-all font-medium tracking-wide text-lg rounded-t-2xl"
              placeholder="e.g. A Cabin in the Woods"
            />
          </div>

          <div className="space-y-4 group">
            <label htmlFor="desc" className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800 flex items-center gap-3 transition-colors group-focus-within:text-emerald-500">
               Your Narrative
            </label>
            <textarea 
              id="desc"
              rows={8}
              className="w-full bg-black/60 border-b border-emerald-950 p-6 text-white/80 placeholder-emerald-950 focus:outline-none focus:border-emerald-600/50 transition-all resize-none text-[15px] leading-relaxed rounded-t-2xl custom-scrollbar"
              placeholder="The rain pattered gently against the glass..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4 group">
              <label htmlFor="mood" className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800 flex items-center gap-2 group-focus-within:text-emerald-500 transition-colors">
                 <Waves className="w-3 h-3" /> Emotional Tone
              </label>
              <input 
                id="mood"
                type="text" 
                className="w-full bg-black/60 border-b border-emerald-950 px-6 py-5 text-white/80 placeholder-emerald-950 focus:outline-none focus:border-emerald-600/50 transition-colors font-medium text-[15px] rounded-t-2xl"
                placeholder="calm, uplifting, mysterious"
              />
            </div>

            <div className="space-y-4 group">
              <label htmlFor="voice" className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800 flex items-center gap-2 group-focus-within:text-emerald-500 transition-colors">
                 <Mic2 className="w-3 h-3" /> Voice Model
              </label>
              <div className="relative">
                <select 
                  id="voice"
                  className="w-full bg-black/60 border-b border-emerald-950 px-6 py-5 text-emerald-500 focus:outline-none focus:border-emerald-600/50 transition-colors appearance-none cursor-pointer font-bold tracking-widest uppercase text-xs rounded-t-2xl"
                  defaultValue=""
                >
                  <option value="" disabled className="text-emerald-900">Select narrator voice</option>
                  <option value="warm-female" className="bg-black">Warm & Soothing (Female)</option>
                  <option value="deep-male" className="bg-black">Deep & Resonant (Male)</option>
                  <option value="storyteller" className="bg-black">The Classic Storyteller</option>
                  <option value="energetic" className="bg-black">Energetic & Bright</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-900">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-10 w-full flex justify-end">
            <button 
              type="button" 
              className="w-full md:w-auto px-12 py-5 bg-emerald-950/20 text-emerald-500 hover:text-white hover:bg-emerald-900/50 border border-emerald-900/50 rounded-full font-bold tracking-widest uppercase text-sm transition-all active:scale-95 flex items-center justify-center gap-4 shadow-[0_0_20px_rgba(16,185,129,0.05)] group"
            >
              Generate Audio
              <ArrowRight className="w-5 h-5 -mt-0.5 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}
