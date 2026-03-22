import Image from 'next/image';
import { Play, SkipBack, SkipForward, Volume2, Fingerprint, Edit3, Trash2, ArrowUpRight } from 'lucide-react';

export default function StoryInfo({ params }: { params: { id: string } }) {
  // Mock data for display based on ID
  const story = {
    title: 'The Silent Code',
    text: `The city's neon lights continuously reflected in the slick obsidian surfaces of the monolithic data towers. It was here, amidst the endless hum of servers and cooling units, that the anomaly first manifested. 

Elara, a level-three sysadmin with an uncharacteristic penchant for analog clockwork, noticed the irregularity during a routine synchronization check. The data packets weren't just corrupted; they were structured, patterned, almost melodic.

She adjusted her neural-link headset, the interface projecting a cascade of shimmering code into her vision. The anomaly pulsed gently, a rogue wavelength caught in the rigid architecture of the city's network. It was trying to communicate.`,
    category: 'Sci-Fi',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1800'
  };

  return (
    <div className="flex flex-col min-h-screen w-full mx-auto pb-48 bg-[#000502] relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-950/20 blur-[200px] pointer-events-none rounded-full" />
      
      {/* Immersive Dark Cyber Header Image */}
      <div className="w-full h-[60vh] relative min-h-[500px]">
        <div className="absolute inset-0 z-0 bg-[#000502]">
          <img 
            src={story.image}
            alt="Story Cover"
            className="w-full h-full object-cover opacity-30 mix-blend-overlay filter grayscale hue-rotate-[90deg]"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#000502] via-[#000502]/80 to-transparent z-10" />
        
        <div className="absolute bottom-0 left-0 right-0 z-20 max-w-5xl mx-auto px-6 lg:px-12 pb-16 flex flex-col justify-end h-full">
           <div className="inline-flex items-center gap-3 px-4 py-1.5 border border-emerald-900/40 rounded-full mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500 bg-emerald-950/20 w-fit backdrop-blur-md">
            {story.category}
          </div>
          <h1 className="text-5xl md:text-7xl font-sans font-medium text-white tracking-tight leading-[1.1] mb-8">
            {story.title}
          </h1>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800 border-b border-emerald-950 pb-6">
            <Fingerprint className="w-4 h-4 text-emerald-600" />
            <span>Sunkar Audio Engine</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 max-w-4xl mx-auto px-6 lg:px-12 w-full pt-16 relative z-30">
        <div className="prose prose-invert prose-lg md:prose-xl max-w-none text-white/70 leading-[2.1] font-normal text-[18px] selection:bg-emerald-900/40 selection:text-white">
          <p className="border-l-2 border-emerald-600 pl-6 mb-12 text-emerald-600 font-bold tracking-widest uppercase text-sm">
            Preparing natural voice narration.
          </p>
          <p className="text-white transition-colors hover:text-emerald-100 first-letter:text-6xl first-letter:font-sans first-letter:text-emerald-500 first-letter:float-left first-letter:mr-6 first-letter:-mt-2 font-serif md:text-[22px]">
            {story.text}
          </p>
        </div>
        
        <div className="mt-24 pt-8 border-t border-emerald-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-950" />
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-800" />
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          </div>
          
          <div className="flex items-center gap-3">
             <button className="p-3 bg-black hover:bg-emerald-950/20 text-emerald-800 hover:text-emerald-500 rounded-xl border border-emerald-900/40 hover:border-emerald-900 transition-all">
              <Edit3 className="w-4 h-4" />
            </button>
             <button className="p-3 bg-black hover:bg-red-950/20 text-emerald-800 hover:text-red-500 rounded-xl border border-emerald-900/40 hover:border-red-900/50 transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Audio Player */}
      <div className="fixed bottom-0 left-0 right-0 w-full bg-[#000502]/95 backdrop-blur-3xl border-t border-emerald-950 z-50">
         <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-5 w-full md:w-3/12 shrink-0">
             <div className="w-12 h-12 bg-black border border-emerald-900/50 rounded-xl items-center justify-center hidden lg:flex shadow-inner">
              <ArrowUpRight className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-white font-medium text-xs tracking-wide truncate">{story.title}</span>
              <span className="text-emerald-800 font-bold text-[10px] mt-1.5 tracking-[0.2em] uppercase">Audio Sync</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center flex-1 w-full md:w-6/12 max-w-xl">
            <div className="flex items-center justify-center gap-8 mb-4">
              <button className="text-emerald-800 hover:text-emerald-500 transition-colors">
                <SkipBack className="w-4 h-4" fill="currentColor" />
              </button>
              <button className="w-14 h-14 flex items-center justify-center bg-emerald-950/20 text-emerald-500 hover:bg-emerald-900/50 hover:text-white hover:scale-110 transition-all rounded-full border border-emerald-900/50">
                <Play className="w-5 h-5 ml-1" fill="currentColor" />
              </button>
              <button className="text-emerald-800 hover:text-emerald-500 transition-colors">
                <SkipForward className="w-4 h-4" fill="currentColor" />
              </button>
            </div>
            
            <div className="flex items-center w-full gap-4 group">
               <span className="text-[10px] text-emerald-900 font-bold tracking-[0.2em] w-12 text-right">00:00</span>
              <div className="h-1 flex-1 bg-emerald-950 rounded-full overflow-hidden cursor-pointer relative">
                <div className="h-full w-1/3 bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all"></div>
              </div>
              <span className="text-[10px] text-emerald-900 font-bold tracking-[0.2em] w-12 text-left">04:32</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-5 w-full md:w-3/12 shrink-0 hidden lg:flex">
             <div className="w-24 h-1 bg-emerald-950 rounded-full overflow-hidden relative cursor-pointer group">
              <div className="h-full w-2/3 bg-emerald-800 group-hover:bg-emerald-500 transition-colors"></div>
            </div>
            <Volume2 className="w-4 h-4 text-emerald-800" />
          </div>
          
        </div>
      </div>
    </div>
  );
}
