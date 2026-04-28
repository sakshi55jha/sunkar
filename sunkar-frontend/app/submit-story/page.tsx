'use client';

import { ArrowRight, Waves, Mic2, Loader2, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

export default function SubmitStory() {
  const { user, isLoaded } = useUser();

 const [title, setTitle] = useState('');
 const [storyText, setStoryText] = useState('');
 const [mood, setMood] = useState('');
 const [voiceModel, setVoiceModel] = useState('');
 const [enhanceWithAI, setEnhanceWithAI] = useState(false);
 const [status, setStatus] = useState<SubmitStatus>('idle');
 const [storyId, setStoryId] = useState('');
 const [error, setError] = useState('');

  const handleSubmit = async ()=>{
       const userId = user?.id;

      if (!isLoaded || !userId) {
    setError('User not logged in');
    return;
  }
      if (!title.trim() || !storyText.trim() || !voiceModel) {
      setError('Please fill in title, story, and select a voice.');
      return;
      }

      setStatus("loading");
      setError('');

      try{
        const res = await fetch(`${BACKEND_URL}/api/creator/submit`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            title,
            storyText,
            mood,
            voiceModel,
            enhanceWithAI,
            userId,
          })
        })

        const data = await res.json();

        if(!res.ok)throw new Error(data.error || "Submission Failed");

        setStoryId(data.storyId);
        setStatus('success');
      } catch(err: any){
        setError(err.message || 'Something went Wrong');
        setStatus('error');
      }
  };

   // ── Success Screen ────────────────────────────────
  if (status === 'success') {
    return (
      <div className="w-full max-w-5xl mx-auto px-6 lg:px-12 pt-24 pb-32 flex flex-col items-center">
        <div className="w-full bg-[#000502] border border-emerald-950 p-14 rounded-[3rem] flex flex-col items-center text-center gap-8">
          <div className="w-20 h-20 rounded-full bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-3xl font-medium text-white mb-3">Story Submitted</h2>
            <p className="text-white/40 text-lg max-w-md">
              Your story is being converted to audio. This usually takes 10 to 30 seconds.
              Check your dashboard to listen and publish.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-950/20 border border-emerald-900/30 rounded-full">
            <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
            <span className="text-emerald-500 text-sm font-bold tracking-widest uppercase">
              Generating Audio...
            </span>
          </div>
          <a
            href="/dashboard"
            className="px-10 py-4 bg-emerald-950/20 text-emerald-500 hover:text-white hover:bg-emerald-900/50 border border-emerald-900/50 rounded-full font-bold tracking-widest uppercase text-sm transition-all"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }


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
          
          <div className="space-y-4 group">
            <label htmlFor="title" className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800 flex items-center gap-3 transition-colors group-focus-within:text-emerald-500">
               Story Title
            </label>
            <input 
              id="title"
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
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
              value={storyText}
              onChange={e => setStoryText(e.target.value)}
              className="w-full bg-black/60 border-b border-emerald-950 p-6 text-white/80 placeholder-emerald-950 focus:outline-none focus:border-emerald-600/50 transition-all resize-none text-[15px] leading-relaxed rounded-t-2xl custom-scrollbar"
              placeholder="The rain pattered gently against the glass..."
            />
              {/* Character count */}
              <p className={`text-right text-[11px] font-bold tracking-widest ${
              storyText.length > 4500 ? 'text-red-500' :
              storyText.length > 3500 ? 'text-amber-500' :
              'text-emerald-900'
            }`}>
              {storyText.length} / 5000
            </p>

          </div>
         
                {/* AI Enhancement Toggle */}
          <div
            onClick={() => setEnhanceWithAI(!enhanceWithAI)}
            className={`flex items-center justify-between p-6 rounded-2xl border cursor-pointer transition-all ${
              enhanceWithAI
                ? 'bg-emerald-950/30 border-emerald-700/50'
                : 'bg-black/30 border-emerald-950 hover:border-emerald-900/50'
            }`}
          >
         <div className="flex items-center gap-4">
              <Sparkles className={`w-5 h-5 ${enhanceWithAI ? 'text-emerald-400' : 'text-emerald-900'}`} />
              <div>
                <p className={`text-sm font-bold tracking-wide ${enhanceWithAI ? 'text-emerald-400' : 'text-emerald-900'}`}>
                  Enhance with AI
                </p>
                <p className="text-[11px] text-white/30 mt-0.5">
                  Gemini will polish your writing before converting to audio
                </p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-all relative ${
              enhanceWithAI ? 'bg-emerald-600' : 'bg-emerald-950'
            }`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                enhanceWithAI ? 'left-7' : 'left-1'
              }`} />
            </div>
          </div>

            {/* Mood + Voice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4 group">
              <label htmlFor="mood" className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800 flex items-center gap-2 group-focus-within:text-emerald-500 transition-colors">
                 <Waves className="w-3 h-3" /> Emotional Tone
              </label>
              <input 
                id="mood"
                type="text" 
                value={mood}
                onChange={e => setMood(e.target.value)}
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
                  value={voiceModel}
                  onChange={e => setVoiceModel(e.target.value)}
                  className="w-full bg-black/60 border-b border-emerald-950 px-6 py-5 text-emerald-500 focus:outline-none focus:border-emerald-600/50 transition-colors appearance-none cursor-pointer font-bold tracking-widest uppercase text-xs rounded-t-2xl"
                >
                 <option value="" disabled className="text-emerald-900">
  Select narrator voice
</option>

{/* English Female Voices */}
<option value="en-female-soft" className="bg-black">
  English Female Soft
</option>
<option value="en-female-warm" className="bg-black">
  English Female Warm
</option>
<option value="en-female-bright" className="bg-black">
  English Female Bright
</option>
<option value="en-female-deep" className="bg-black">
  English Female Deep
</option>

{/* English Male Voices */}
<option value="en-male-deep" className="bg-black">
  English Male Deep
</option>
<option value="en-male-storyteller" className="bg-black">
  English Male Storyteller
</option>
<option value="en-male-calm" className="bg-black">
  English Male Calm
</option>
<option value="en-male-rich" className="bg-black">
  English Male Rich
</option>

{/* Hindi Female Voices */}
<option value="hi-female-soft" className="bg-black">
  Hindi Female Soft
</option>
<option value="hi-female-warm" className="bg-black">
  Hindi Female Warm
</option>
<option value="hi-female-bright" className="bg-black">
  Hindi Female Bright
</option>
<option value="hi-female-deep" className="bg-black">
  Hindi Female Deep
</option>

{/* Hindi Male Voices */}
<option value="hi-male-deep" className="bg-black">
  Hindi Male Deep
</option>
<option value="hi-male-storyteller" className="bg-black">
  Hindi Male Storyteller
</option>
<option value="hi-male-calm" className="bg-black">
  Hindi Male Calm
</option>
<option value="hi-male-rich" className="bg-black">
  Hindi Male Rich
</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-900">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

           {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-950/20 border border-red-900/40 rounded-2xl">
              <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

         {/* submit button */}

          <div className="pt-10 w-full flex justify-end">
            <button 
              type="button" 
              onClick={handleSubmit}
              disabled={status === 'loading'}

              className="w-full md:w-auto px-12 py-5 bg-emerald-950/20 text-emerald-500 hover:text-white hover:bg-emerald-900/50 border border-emerald-900/50 rounded-full font-bold tracking-widest uppercase text-sm transition-all active:scale-95 flex items-center justify-center gap-4 shadow-[0_0_20px_rgba(16,185,129,0.05)] group"
            >
              
             {status === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Generate Audio
                  <ArrowRight className="w-5 h-5 -mt-0.5 group-hover:translate-x-1 transition-all" />
                </>
              )}
            </button>
          </div>
          
      </div>
    </div>
  );
}
