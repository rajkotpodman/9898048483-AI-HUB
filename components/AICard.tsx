'use client'
import { Star } from 'lucide-react';

export default function AICard({ model }: { model: any }) {
  return (
    <div id={model.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#1a1d24] border border-transparent hover:border-gray-700 transition">
      <div className={`w-1 h-10 rounded-full ${model.color}`} />
      <div className="flex-1 font-medium text-white">{model.name}</div>
      <Star className="text-gray-500 hover:text-yellow-400 cursor-pointer" size={20} />
    </div>
  );
}
