'use client'
import { useState } from 'react';
import { X, Globe, MessageSquare, Maximize2 } from 'lucide-react';

export default function InteractionManager({ model, onClose }: { model: any, onClose: () => void }) {
  const [mode, setMode] = useState<'iframe' | 'chat' | 'arena'>('iframe');

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 p-4 flex flex-col">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{model.name}</h2>
        <button onClick={onClose}><X /></button>
      </header>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        <button 
          onClick={() => setMode('iframe')}
          className={`px-4 py-2 rounded-full ${mode === 'iframe' ? 'bg-blue-600' : 'bg-gray-800'}`}
        >
          <Globe size={16} className="inline mr-2" /> Web Sandbox
        </button>
        <button 
          onClick={() => setMode('chat')}
          className={`px-4 py-2 rounded-full ${mode === 'chat' ? 'bg-blue-600' : 'bg-gray-800'}`}
        >
          <MessageSquare size={16} className="inline mr-2" /> Chat
        </button>
        <button 
          onClick={() => setMode('arena')}
          className={`px-4 py-2 rounded-full ${mode === 'arena' ? 'bg-blue-600' : 'bg-gray-800'}`}
        >
          <Maximize2 size={16} className="inline mr-2" /> Arena
        </button>
      </div>

      <div className="flex-1 rounded-xl overflow-hidden bg-gray-900 border border-gray-700">
        {mode === 'iframe' ? (
          <iframe 
            src={model.url} 
            className="w-full h-full" 
            title="AI Sandbox"
            referrerPolicy="no-referrer"
          />
        ) : mode === 'chat' ? (
          <div className="p-4 h-full flex flex-col">
            <input 
                type="text" 
                placeholder="Enter API Key (BYOK)" 
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 mb-4"
            />
            <div className="flex-1 bg-gray-800 rounded p-4 overflow-y-auto mb-4">
              Chat interface placeholder for {model.name}
            </div>
            <input 
                type="text" 
                placeholder="Type your prompt..." 
                className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            />
          </div>
        ) : (
          <div className="p-4 h-full flex gap-4">
            <div className="flex-1 bg-gray-800 rounded p-4">Model 1 Arena</div>
            <div className="flex-1 bg-gray-800 rounded p-4">Model 2 Arena</div>
          </div>
        )}
      </div>
    </div>
  );
}
