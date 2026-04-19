// 'use client';

// import { useEffect, useState } from 'react';
// import Link from 'next/link';
// import {
//   Edit2, Trash2, Headphones, Play, Library,
//   Loader2, Globe, EyeOff, RefreshCw, AlertCircle, Clock
// } from 'lucide-react';

// const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
// const USER_ID = 'user_sneha_2026';

// // TYPES
// interface CreatorStory {
//   id:          string;
//   title:       string;
//   mood:        string | null;
//   voiceModel:  string;
//   audioUrl:    string | null;
//   status:      'PROCESSING' | 'READY' | 'FAILED';
//   isPublished: boolean;
//   createdAt:   string;
// }

// // HELPERS
// function formatDate(dateStr: string): string {
//   return new Date(dateStr).toLocaleDateString('en-IN', {
//     day:   '2-digit',
//     month: 'short',
//     year:  'numeric',
//   });
// }

// const VOICE_LABELS: Record<string, string> = {
//   'warm-female': 'Warm & Soothing',
//   'deep-male':   'Deep & Resonant',
//   'storyteller': 'Classic Storyteller',
//   'energetic':   'Energetic & Bright',
// };

// // STATUS BADGE COMPONENT

// function StatusBadge({status}: {status: CreatorStory['status']}){
//           if(status === 'PROCESSING'){
//             return(
//                   <span className="flex items-center gap-1.5 text-amber-600 text-[10px] font-bold tracking-[0.15em] uppercase">
//         <Loader2 className="w-3 h-3 animate-spin" />
//         Processing
//       </span>
//             )
//           }

//            if (status === 'FAILED') {
//     return (
//       <span className="flex items-center gap-1.5 text-red-600 text-[10px] font-bold tracking-[0.15em] uppercase">
//         <AlertCircle className="w-3 h-3" />
//         Failed
//       </span>
//     );
//   }

//    return (
//     <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold tracking-[0.15em] uppercase">
//       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
//       Ready
//     </span>
//   );
// }

// // COMPONENT
// export default function YourStory() {
//   const [stories, setStories]   = useState<CreatorStory[]>([]);
//   const [loading, setLoading]   = useState(true);
//   const [deletingId, setDeletingId]   = useState<string | null>(null);
//   const [publishingId, setPublishingId] = useState<string | null>(null);
//   const [retryingId, setRetryingId]   = useState<string | null>(null);
 

// }