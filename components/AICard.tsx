'use client'
import { Star, ExternalLink, Sparkles, Globe, Flame } from 'lucide-react';

export default function AICard({ 
  model, 
  isFavorite, 
  onToggleFavorite, 
  onSelect 
}: { 
  model: any, 
  isFavorite: boolean, 
  onToggleFavorite: () => void, 
  onSelect: () => void 
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
      onClick={onSelect}
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
                const url = model.url || `https://google.com/search?q=${encodeURIComponent(model.name + " AI")}`;
                window.open(url, '_blank');
            }}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-blue-400 font-medium transition-colors px-1.5 py-0.5 rounded hover:bg-slate-800"
            title="Open in External Tab"
          >
             <ExternalLink size={12} />
             <span className="hidden sm:inline">External Tab</span>
          </button>
          <span className="inline-flex items-center gap-1 text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform ml-1">
            <Sparkles size={13} />
            <span>Launch</span>
          </span>
        </div>
      </div>
    </div>
  );
}

