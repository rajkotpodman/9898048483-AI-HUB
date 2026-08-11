import AIHub from '@/components/AIHub';
import CollaborationLayer from '@/components/CollaborationLayer';
import { Download } from 'lucide-react';
import Link from 'next/link';

export default function Page() {
  return (
    <>
      <CollaborationLayer roomId="hub-general" />
      <AIHub />
      <div className="fixed bottom-6 right-6 z-50">
        <Link 
          href="/api/download"
          className="group flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-blue-600 rounded-full shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:scale-105 transition-all"
        >
          <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
          Download Python Server App
        </Link>
      </div>
    </>
  );
}

