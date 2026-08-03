'use client'
import { Star } from 'lucide-react';

export default function AICard({ model, isFavorite, onToggleFavorite, onSelect }: { model: any, isFavorite: boolean, onToggleFavorite: () => void, onSelect: () => void }) {
  return (
    <div id={model.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#1a1d24] border border-transparent hover:border-gray-700 transition cursor-pointer" onClick={onSelect}>
      <div className={`w-1 h-10 rounded-full ${model.color}`} />
      <div className="flex-1 font-medium text-white">{model.name}</div>
      <Star 
        className={`cursor-pointer ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`} 
        size={20} 
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
      />
    </div>
  );
}
