'use client';

import { ArrowRight, Waves, Mic2, Loader2, CheckCircle, XCircle, Sparkles, Image as ImageIcon, X } from 'lucide-react';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

export default function SubmitStory() {
  const { user, isLoaded } = useUser();

 const [title, setTitle] = useState('');
 const [storyText, setStoryText] = useState('');
 const [mood, setMood] = useState('');
 const [voiceModel, setVoiceModel] = useState('');
 const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
 const [coverImageUrl, setCoverImageUrl] = useState('');
 const [enhanceWithAI, setEnhanceWithAI] = useState(false);
 const [status, setStatus] = useState<SubmitStatus>('idle');
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
        let finalCoverUrl: string | undefined = undefined;
        
        // ── Direct Cloudinary Upload ──
        if (coverImageFile) {
          const sigRes = await fetch(`${BACKEND_URL}/api/creator/upload-signature`);
          if (!sigRes.ok) throw new Error("Failed to get upload signature");
          const { signature, timestamp, folder, cloudName, apiKey } = await sigRes.json();
          
          const formData = new FormData();
          formData.append("file", coverImageFile);
          formData.append("api_key", apiKey);
          formData.append("timestamp", timestamp.toString());
          formData.append("signature", signature);
          formData.append("folder", folder);

          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: formData,
          });
          
          if (!uploadRes.ok) throw new Error("Failed to upload image securely");
          const uploadData = await uploadRes.json();
          finalCoverUrl = uploadData.secure_url;
        }

        const res = await fetch(`${BACKEND_URL}/api/creator/submit`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            title,
            storyText,
            mood,
            voiceModel,
            coverImageUrl: finalCoverUrl,
            enhanceWithAI,
            userId,
          })
        })

        const data = await res.json();

        if(!res.ok)throw new Error(data.error || "Submission Failed");

        setStatus('success');
      } catch(err: unknown){
        setError(err instanceof Error ? err.message : 'Something went Wrong');
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
              Generating Audio......
            </span>
          </div>
          <Link
            href="/your-story"
            className="px-10 py-4 bg-emerald-950/20 text-emerald-500 hover:text-white hover:bg-emerald-900/50 border border-emerald-900/50 rounded-full font-bold tracking-widest uppercase text-sm transition-all"
          >
            Go to Dashboard
          </Link>

        </div>
      </div>
    );
  }


  return (
    <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-32 flex flex-col items-center relative">
      <div className="flex flex-col items-center mb-16 text-center relative z-10 w-full">
        <h1 className="text-5xl md:text-7xl font-sans font-medium tracking-tight mb-6">
          <span className="text-white/40">Bring your writing</span> <br className="hidden md:block"/>
          <span className="text-white drop-shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            to life with audio
          </span>
        </h1>
        <p className="text-white/50 font-normal max-w-xl text-lg leading-relaxed">
          Submit your own story and let Sunkar’s AI transform it into a highly evocative, realistic listening experience.
        </p>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 relative z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-950/10 blur-[200px] pointer-events-none rounded-full" />

        {/* LEFT COLUMN: Editor */}
        <div className="bg-[#010603] border border-emerald-950 shadow-[0_20px_40px_-20px_rgba(16,185,129,0.05)] rounded-[2.5rem] p-8 md:p-10 flex flex-col gap-8 relative overflow-hidden group/editor focus-within:border-emerald-900/50 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/10 via-transparent to-transparent opacity-0 group-focus-within/editor:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <div className="space-y-3 relative z-10">
            <label htmlFor="title" className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800 flex items-center gap-2 transition-colors">
               Story Title
            </label>
            <input 
              id="title"
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-transparent border-b border-emerald-950 pb-4 text-3xl text-white placeholder-emerald-950/40 focus:outline-none focus:border-emerald-500 transition-all font-medium tracking-tight"
              placeholder="e.g. A Cabin in the Woods"
            />
          </div>

          <div className="space-y-3 relative z-10 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <label htmlFor="desc" className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800 flex items-center gap-2 transition-colors">
                Your Narrative
              </label>
              <span className={`text-[10px] font-bold tracking-widest ${storyText.length > 4500 ? 'text-red-500' : storyText.length > 3500 ? 'text-amber-500' : 'text-emerald-900'}`}>
                {storyText.length} / 5000
              </span>
            </div>
            <textarea 
              id="desc"
              value={storyText}
              onChange={e => setStoryText(e.target.value)}
              className="w-full flex-1 min-h-[400px] bg-transparent border-none text-white/80 placeholder-emerald-950/30 focus:outline-none resize-none text-lg leading-relaxed custom-scrollbar py-2"
              placeholder="The rain pattered gently against the glass..."
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Settings */}
        <div className="flex flex-col gap-6">
          {/* Cover Image Card */}
          <div className="bg-[#010603] border border-emerald-950 rounded-[2rem] p-8 transition-colors hover:border-emerald-900/30 relative z-10">
            <label htmlFor="coverImageUrl" className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800 flex items-center gap-2 mb-6">
               <ImageIcon className="w-3.5 h-3.5" /> Cover Image (Optional)
            </label>
            
            {!coverImageUrl ? (
              <div className="relative group cursor-pointer">
                <input 
                  id="coverImageUrl"
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCoverImageFile(file);
                      setCoverImageUrl(URL.createObjectURL(file));
                    } else {
                      setCoverImageFile(null);
                      setCoverImageUrl('');
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full h-32 border border-dashed border-emerald-900/40 rounded-2xl bg-emerald-950/10 flex flex-col items-center justify-center gap-2 group-hover:border-emerald-600/50 group-hover:bg-emerald-950/20 transition-all">
                  <ImageIcon className="w-6 h-6 text-emerald-800 group-hover:text-emerald-500 transition-colors" />
                  <span className="text-xs font-medium text-emerald-700 group-hover:text-emerald-500 transition-colors">Click to upload image</span>
                </div>
              </div>
            ) : (
              <div className="relative w-full aspect-[4/3] group/preview rounded-2xl overflow-hidden border border-emerald-900/50">
                <img 
                  src={coverImageUrl} 
                  alt="Cover Preview" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={() => { setCoverImageFile(null); setCoverImageUrl(''); }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/30"
                  >
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Enhance Card */}
          <div
            onClick={() => setEnhanceWithAI(!enhanceWithAI)}
            className={`p-6 rounded-[2rem] border cursor-pointer transition-all flex items-center justify-between group relative z-10 ${
              enhanceWithAI
                ? 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                : 'bg-[#010603] border-emerald-950 hover:border-emerald-900/50'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${enhanceWithAI ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-950/30 text-emerald-800'}`}>
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-sm font-bold tracking-wide transition-colors ${enhanceWithAI ? 'text-white' : 'text-emerald-700 group-hover:text-emerald-500'}`}>
                  Enhance with AI
                </p>
                <p className="text-[11px] text-white/40 mt-1">
                  Gemini polishes your writing
                </p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-all relative ${
              enhanceWithAI ? 'bg-emerald-500' : 'bg-emerald-950'
            }`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                enhanceWithAI ? 'left-7 shadow-sm' : 'left-1'
              }`} />
            </div>
          </div>

          {/* Tone & Voice Card */}
          <div className="bg-[#010603] border border-emerald-950 rounded-[2rem] p-8 flex flex-col gap-6 relative z-10">
            <div className="space-y-3">
              <label htmlFor="mood" className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800 flex items-center gap-2">
                 <Waves className="w-3.5 h-3.5" /> Emotional Tone
              </label>
              <input 
                id="mood"
                type="text" 
                value={mood}
                onChange={e => setMood(e.target.value)}
                className="w-full bg-emerald-950/10 border border-emerald-900/30 px-5 py-4 text-white placeholder-emerald-950/50 focus:outline-none focus:border-emerald-500/50 transition-all font-medium text-sm rounded-xl"
                placeholder="e.g. calm, uplifting, mysterious"
              />
            </div>

            <div className="space-y-3">
              <label htmlFor="voice" className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800 flex items-center gap-2">
                 <Mic2 className="w-3.5 h-3.5" /> Voice Model
              </label>
              <div className="relative">
                <select 
                  id="voice"
                  value={voiceModel}
                  onChange={e => setVoiceModel(e.target.value)}
                  className="w-full bg-emerald-950/10 border border-emerald-900/30 px-5 py-4 text-emerald-400 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none cursor-pointer font-bold tracking-widest uppercase text-xs rounded-xl"
                >
                  <option value="" disabled className="text-emerald-900">Select narrator voice</option>
                  <optgroup label="English Female" className="bg-[#000502] text-white">
                    <option value="en-female-soft">English Female Soft</option>
                    <option value="en-female-warm">English Female Warm</option>
                    <option value="en-female-bright">English Female Bright</option>
                    <option value="en-female-deep">English Female Deep</option>
                  </optgroup>
                  <optgroup label="English Male" className="bg-[#000502] text-white">
                    <option value="en-male-deep">English Male Deep</option>
                    <option value="en-male-storyteller">English Male Storyteller</option>
                    <option value="en-male-calm">English Male Calm</option>
                    <option value="en-male-rich">English Male Rich</option>
                  </optgroup>
                  <optgroup label="Hindi Female" className="bg-[#000502] text-white">
                    <option value="hi-female-soft">Hindi Female Soft</option>
                    <option value="hi-female-warm">Hindi Female Warm</option>
                    <option value="hi-female-bright">Hindi Female Bright</option>
                    <option value="hi-female-deep">Hindi Female Deep</option>
                  </optgroup>
                  <optgroup label="Hindi Male" className="bg-[#000502] text-white">
                    <option value="hi-male-deep">Hindi Male Deep</option>
                    <option value="hi-male-storyteller">Hindi Male Storyteller</option>
                    <option value="hi-male-calm">Hindi Male Calm</option>
                    <option value="hi-male-rich">Hindi Male Rich</option>
                  </optgroup>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-800">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-950/20 border border-red-900/40 rounded-2xl animate-in fade-in slide-in-from-top-2 relative z-10">
              <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="button" 
            onClick={handleSubmit}
            disabled={status === 'loading'}
            className="w-full mt-auto h-16 bg-emerald-600 hover:bg-emerald-500 text-black rounded-[2rem] font-bold tracking-[0.2em] uppercase text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-4 shadow-[0_0_30px_rgba(16,185,129,0.3)] group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 relative z-10"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                Generate Audio
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}
