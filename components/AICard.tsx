'use client'
import { Star, ExternalLink, Sparkles, Globe, Flame, MessageSquare } from 'lucide-react';

export default function AICard({ 
  model, 
  isFavorite, 
  onToggleFavorite, 
  onLaunch,
  onChat
}: { 
  model: any, 
  isFavorite: boolean, 
  onToggleFavorite: () => void, 
  onLaunch: () => void,
  onChat: () => void
}) {
  const colorClass = model.color || 'bg-blue-500';
  const isWeb = model.isWebDiscovered || model.id?.startsWith('web-');

  return (
    <div 
      id={model.id || model.name?.toLowerCase().replace(/\s+/g, '-')} 
      className={`group relative flex flex-col justify-between p-5 rounded-2xl bg-slate-900/90 border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${
        isWeb 
          ? 'border-cyan-500/30 hover:border-cyan-400/60 bg-gradient-to-b from-slate-900 to-slate-950' 
          : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
      }`}
      onClick={onLaunch}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-full ${colorClass} ring-4 ring-slate-800/50 flex-shrink-0`} />
            <h3 className="font-semibold text-slate-100 text-base sm:text-lg group-hover:text-blue-400 transition-colors line-clamp-1">
              {model.name}
            </h3>
          </div>
          <button 
            type="button"
            aria-label="Toggle Favorite"
            className="p-1 rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0"
            onClick={(e) => { 
              e.stopPropagation(); 
              onToggleFavorite(); 
            }}
          >
            <Star 
              className={`transition-all duration-200 ${isFavorite ? 'text-amber-400 fill-amber-400 scale-110' : 'text-slate-500 hover:text-slate-300'}`} 
              size={18} 
            />
          </button>
        </div>

        {isWeb && (
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Globe size={10} className="animate-pulse" />
              Live Web
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Flame size={10} />
              Auto-Synced
            </span>
          </div>
        )}

        {model.description && (
          <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
            {model.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs text-slate-400">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700/50">
          {model.category || 'General AI'}
        </span>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                onChat();
            }}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-emerald-400 font-medium transition-colors px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
            title="Chat Inside App"
          >
             <MessageSquare size={13} />
             <span>Chat</span>
          </button>
          <button 
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                onLaunch();
            }}
            className="inline-flex items-center gap-1 text-blue-400 font-medium hover:text-blue-300 transition-colors ml-1"
            title="Launch in New Tab"
          >
            <Sparkles size={13} />
            <span>Launch</span>
          </button>
        </div>
      </div>
    </div>
  );
}

