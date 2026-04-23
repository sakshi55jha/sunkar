import Link from 'next/link';
import { Headphones, Play } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'


// Fallback images for stories without cover images
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1505820013142-f86a3439c5b2?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1471506480208-91b3a4cc78be?auto=format&fit=crop&q=80&w=600',
];

interface PublicStory{
     id: string;
     title: string;
     mood: string | null;
     audioUrl: string;
     createdAt: string
}

async function fetchPublicStories(): Promise<PublicStory[]>{
  try{
    const res = await fetch(`${BACKEND_URL}/api/stories/public`, {
      cache: 'no-store', //Always fetch fresh o each request
    });
    if(!res.ok) return [];
    return res.json();
  }catch{
    return [];
  }
}


export default async function Home() {
  const stories = await fetchPublicStories();

  return (
    <div className="max-w-6xl mx-auto px-6 w-full pt-32 pb-32 relative">
      <div className="absolute top-0 right-10 w-[600px] h-[600px] bg-emerald-900/10 blur-[200px] rounded-full pointer-events-none" />
      
      <div className="mb-24 flex flex-col items-center justify-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-900/40 bg-emerald-950/20 backdrop-blur-md text-[11px] font-bold tracking-widest uppercase mb-8 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <Headphones className="w-3.5 h-3.5" /> Audio-First Storytelling
        </div>
        <h1 className="text-5xl md:text-7xl font-sans font-medium tracking-tight leading-[1.1]">
          <span className="text-white">Immersive stories,</span>{' '}
          <br />
          <span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            crafted to be heard.
          </span>
        </h1>
        <p className="text-white/60 text-lg max-w-2xl mt-8 font-normal leading-relaxed">
          Turn your ideas into calm, emotionally engaging narratives. Sunkar uses AI to transform your thoughts into effortless listening experiences with incredibly realistic voices. No distractions, just the power of audio.
        </p>
      </div>

       {stories.length === 0 ? (
        <div className='text-center py-24'>
          <p className='text-emerald-900 text-sm font-bold tracking-widest uppercase'>
            No Stories Published yet
          </p>
        </div>
       ): (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {stories.map((story, index) => (
          <Link 
          href={`/story/${story.id}`} 
          key={story.id} 
          className="group flex flex-col bg-[#010603] border border-emerald-950 hover:border-emerald-600/50 rounded-3xl transition-all duration-500 overflow-hidden shadow-2xl hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.2)]"
          >
            <div className="relative aspect-square w-full overflow-hidden bg-black">
              <div className="absolute inset-0 bg-emerald-950/60 mix-blend-color z-10 group-hover:bg-emerald-900/40 transition-all duration-500"></div>
              <img 
                src={FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]} 
                alt={story.title}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-[1.05] filter grayscale group-hover:grayscale-0 hue-rotate-[90deg] transition-all duration-700 ease-in-out"
              />
            </div>
            
            <div className="p-8 bg-[#010603] flex flex-col gap-8 transition-colors">
              <div>
                <p className="text-emerald-700 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
                   {story.mood || 'Acoustic Experience'}
                </p>
                <h3 className="text-xl font-medium tracking-tight text-white group-hover:text-emerald-500 transition-all duration-500">
                  {story.title}
                </h3>
              </div>
              <div className="w-full flex items-center justify-end">
                <div className="w-10 h-10 rounded-full border border-emerald-900/50 flex items-center justify-center bg-emerald-950/20 group-hover:bg-emerald-600 group-hover:border-emerald-500 transition-all duration-300 text-emerald-500 group-hover:text-black">
                  <Play className="w-4 h-4 transition-colors" fill="currentColor" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      ) }
    
    </div>
  );
}
