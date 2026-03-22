import { Edit2, Trash2, Headphones, Play, Library } from 'lucide-react';

export default function YourStory() {
  const stories = [
    { id: 1, title: 'Echoes in the Rain', desc: 'A calming narrative about an evening walk through a rain-slicked city, finding peace in the sounds of nature and distant traffic.', category: 'Ambient', date: 'Oct 24, 2026', time: '12 min' },
    { id: 2, title: 'The Silent Horizon', desc: 'A subtle, emotionally evocative journey of an astronaut reflecting on the vast beauty of Earth from orbit, perfectly soundscaped for deep focus.', category: 'Sci-Fi', date: 'Nov 02, 2026', time: '8 min' }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-6 lg:px-8 pt-32 pb-32">
      <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-8">
        <div>
           <div className="inline-flex items-center gap-2 mb-6 text-emerald-800 font-bold text-[11px] uppercase tracking-[0.2em] bg-emerald-950/20 px-4 py-2 rounded-full border border-emerald-900/40">
            <Library className="w-3.5 h-3.5 text-emerald-600" /> Sunkar Collection
          </div>
          <h1 className="text-5xl lg:text-7xl font-sans font-medium tracking-tight leading-[1.1]">
            <span className="text-emerald-800">Your audio </span> <br className="hidden lg:block"/>
            <span className="text-white drop-shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              library.
            </span>
          </h1>
        </div>
        <p className="text-white/50 font-normal text-[15px] lg:text-right max-w-[280px] leading-relaxed">
           Your personal collection of human-like audio narratives, ready for effortless listening anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {stories.map(story => (
          <div key={story.id} className="group flex flex-col h-full bg-[#000502] border border-emerald-950 hover:border-emerald-900/50 rounded-[2.5rem] p-8 lg:p-12 transition-all duration-500 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.05)] hover:-translate-y-2 relative overflow-hidden">
            
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-950/20 blur-[150px] transition-colors pointer-events-none rounded-full" />

            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className="flex flex-col gap-2.5">
                <span className="text-emerald-500 text-[10px] font-bold tracking-[0.2em] uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> {story.category}
                </span>
                <span className="text-emerald-900 text-[10px] font-bold tracking-[0.2em] uppercase">
                  {story.date}
                </span>
              </div>

              <div className="flex items-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-3 bg-black hover:bg-emerald-950/20 text-emerald-800 hover:text-emerald-400 rounded-2xl border border-emerald-900/30 transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
                 <button className="p-3 bg-black hover:bg-red-950/40 text-emerald-800 hover:text-red-500 rounded-2xl border border-emerald-900/30 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-5 relative z-10">
              <h3 className="text-3xl font-medium text-emerald-600 tracking-tight group-hover:text-white transition-all duration-500 pb-1">
                {story.title}
              </h3>
              <p className="text-white/50 leading-relaxed font-normal text-[15px]">
                {story.desc}
              </p>
            </div>

            <div className="pt-12 mt-auto flex items-center justify-between relative z-10">
              <span className="text-emerald-900 group-hover:text-emerald-600 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors flex items-center gap-2">
                <Headphones className="w-3.5 h-3.5" /> {story.time} Listen
              </span>
              <button className="flex items-center justify-center w-14 h-14 bg-emerald-950/20 hover:bg-emerald-900/50 text-emerald-500 hover:text-white rounded-full transition-all group-hover:scale-105 border border-emerald-900/50 shadow-[0_5px_15px_rgba(16,185,129,0.1)]">
                <Play className="w-5 h-5 ml-1" fill="currentColor" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
