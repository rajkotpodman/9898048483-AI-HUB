'use client'
import { useState, useRef, useEffect } from 'react';
import { X, Globe, MessageSquare, Maximize2, Send, Code, Loader2, Bot } from 'lucide-react';
import { useSyncEngine } from '../lib/sync/useSyncEngine';

export default function InteractionManager({ model, onClose }: { model: any, onClose: () => void }) {
  const [mode, setMode] = useState<'iframe' | 'chat' | 'arena'>('iframe');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  
  const { queueSync, isAuthenticated } = useSyncEngine();

  const handleSendPrompt = async () => {
    if (!prompt.trim()) return;
    const newMsg = { role: 'user' as const, content: prompt };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setPrompt('');
    setIsGenerating(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName: model.name,
          prompt: newMsg.content,
          apiKey
        })
      });
      const data = await res.json();
      
      const aiResponse = { role: 'ai' as const, content: data.response || 'No response' };
      const finalMessages = [...updatedMessages, aiResponse];
      setMessages(finalMessages);

      if (isAuthenticated) {
        // Backup the conversation
        const conversationText = finalMessages.map(m => `${m.role.toUpperCase()}:\n${m.content}\n`).join('\n---\n');
        queueSync('CONVERSATION', `${model.name}_Chat_${Date.now()}.txt`, conversationText, 'GOOGLE_DRIVE');
      }
    } catch (e) {
      console.error('Chat error:', e);
      setMessages([...updatedMessages, { role: 'ai' as const, content: 'Error communicating with backend.' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName: model.name,
          prompt,
          apiKey
        })
      });
      const data = await res.json();
      setGeneratedCode(data.code || '');

      if (isAuthenticated) {
        // Backup generated code
        queueSync('CODE', `${model.name}_Script_${Date.now()}.js`, data.code || '', 'GOOGLE_DRIVE');
      }
    } catch (e) {
      console.error('Code generation error:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 p-4 flex flex-col animate-in fade-in zoom-in-95 duration-200">
      <header className="flex justify-between items-center mb-4 text-white">
        <h2 className="text-xl font-bold flex items-center gap-2">
          {model.name}
          <span className="text-[10px] uppercase font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
            {model.category}
          </span>
        </h2>
        <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors">
          <X size={20} />
        </button>
      </header>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        <button 
          onClick={() => setMode('iframe')}
          className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${mode === 'iframe' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          <Globe size={16} /> Web Sandbox
        </button>
        <button 
          onClick={() => setMode('chat')}
          className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${mode === 'chat' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          <MessageSquare size={16} /> Chat & Prompts
        </button>
        <button 
          onClick={() => setMode('arena')}
          className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${mode === 'arena' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          <Maximize2 size={16} /> Arena
        </button>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden bg-slate-900/50 border border-slate-800 flex flex-col shadow-2xl">
        {mode === 'iframe' ? (
          <div className="h-full w-full bg-slate-100 relative">
             <iframe 
                src={model.url || 'https://google.com'} 
                className="w-full h-full border-0" 
                title={`${model.name} Sandbox`}
                referrerPolicy="no-referrer"
             />
          </div>
        ) : mode === 'chat' ? (
          <div className="p-4 h-full flex flex-col max-w-4xl mx-auto w-full">
            <div className="mb-4 flex items-center gap-3">
               <input 
                  type="password" 
                  placeholder="Enter Provider API Key (BYOK) - Stays local" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
               />
               {isAuthenticated && (
                 <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 whitespace-nowrap">
                   Cloud Backup ON
                 </span>
               )}
            </div>
            
            <div className="flex-1 bg-slate-800/50 border border-slate-800 rounded-xl p-4 overflow-y-auto mb-4 flex flex-col gap-3">
              {messages.length === 0 ? (
                <div className="text-center text-slate-500 my-auto text-sm">
                  Start a conversation with {model.name}.<br/>
                  {isAuthenticated && <span className="text-xs text-blue-400 mt-2 block">Chats are automatically backed up to Google Drive.</span>}
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`p-3 rounded-xl max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 self-end' : 'bg-slate-700/50 border border-slate-600 text-slate-200 self-start'}`}>
                    {msg.content}
                  </div>
                ))
              )}
              {isGenerating && (
                <div className="p-3 rounded-xl bg-slate-700/30 text-slate-400 self-start flex items-center gap-2 text-sm border border-slate-700">
                  <Loader2 size={14} className="animate-spin" /> Generating...
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="Type your prompt..." 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
                    className="flex-1 p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                />
                <button 
                  onClick={handleSendPrompt}
                  disabled={isGenerating || !prompt.trim()}
                  className="px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors"
                >
                  <Send size={18} />
                </button>
                <button 
                  onClick={handleGenerateCode}
                  disabled={isGenerating || !prompt.trim()}
                  title="Generate Code & Backup"
                  className="px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors"
                >
                  <Code size={18} />
                </button>
              </div>
              
              {generatedCode && (
                <div className="mt-2 p-3 bg-slate-900 border border-slate-700 rounded-xl relative group">
                  <span className="absolute right-3 top-2 text-[10px] text-slate-500 uppercase font-bold">Generated Code</span>
                  <pre className="text-xs text-emerald-400 overflow-x-auto p-2">
                    {generatedCode}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 h-full flex gap-4 w-full text-slate-300">
            <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 p-4 flex flex-col items-center justify-center text-center">
              <Bot size={48} className="text-slate-600 mb-4" />
              <p className="font-semibold">{model.name}</p>
              <p className="text-xs text-slate-500">Arena Competitor 1</p>
            </div>
            <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 p-4 flex flex-col items-center justify-center text-center">
              <Bot size={48} className="text-slate-600 mb-4" />
              <p className="font-semibold">Mystery Model</p>
              <p className="text-xs text-slate-500">Arena Competitor 2</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
