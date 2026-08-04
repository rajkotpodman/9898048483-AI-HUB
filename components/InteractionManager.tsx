'use client'
import { useState, useRef, useEffect } from 'react';
import { X, Globe, MessageSquare, Maximize2, Send, Code, Loader2, Bot, Cpu, TerminalSquare } from 'lucide-react';
import { useSyncEngine } from '../lib/sync/useSyncEngine';
import dynamic from 'next/dynamic';
import { useLocalAI } from '../lib/useLocalAI';

const SharedPromptEditor = dynamic(() => import('./SharedPromptEditor'), { ssr: false });
const WebContainerSandbox = dynamic(() => import('./WebContainerSandbox'), { ssr: false });

export default function InteractionManager({ model, onClose }: { model: any, onClose: () => void }) {
  const [mode, setMode] = useState<'iframe' | 'chat' | 'arena' | 'sandbox'>('iframe');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [useLocal, setUseLocal] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  
  const { queueSync, isAuthenticated } = useSyncEngine();
  const localAI = useLocalAI();

  const handleSendPrompt = async () => {
    if (!prompt.trim()) return;
    const newMsg = { role: 'user' as const, content: prompt };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setPrompt('');
    setIsGenerating(true);

    if (useLocal) {
        try {
            const localResult = await localAI.generateText(newMsg.content);
            setMessages(prev => [...prev, { role: 'ai', content: `[Local WebGPU/Worker] ${localResult}` }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'ai', content: 'Local AI Error.' }]);
        } finally {
            setIsGenerating(false);
        }
        return;
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName: model.name,
          prompt: newMsg.content,
          apiKey,
          debug: debugMode
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate response');
      }

      const aiResponse = { role: 'ai' as const, content: data.response || 'No response' };
      const finalMessages = [...updatedMessages, aiResponse];
      setMessages(finalMessages);

      if (isAuthenticated) {
        // Backup the conversation
        const conversationText = finalMessages.map(m => `${m.role.toUpperCase()}:\n${m.content}\n`).join('\n---\n');
        queueSync('CONVERSATION', `${model.name}_Chat_${Date.now()}.txt`, conversationText, 'GOOGLE_DRIVE');
      }
    } catch (e: any) {
      console.error('Chat error:', e);
      setMessages([...updatedMessages, { role: 'ai' as const, content: `Error: ${e.message || 'Error communicating with backend.'}` }]);
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
      setMode('sandbox'); // Switch to sandbox mode automatically

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
          <MessageSquare size={16} /> Chat & CRDT
        </button>
        <button 
          onClick={() => setMode('sandbox')}
          className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${mode === 'sandbox' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          <TerminalSquare size={16} /> WebContainers CI/CD
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
          <div className="h-full w-full bg-slate-950 relative flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
            {model.url ? (
               <div className="max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center my-auto">
                  <div className="bg-blue-600/20 text-blue-400 p-4 rounded-2xl mb-4 border border-blue-500/30">
                     <Globe size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{model.name} Launch Center</h3>
                  <p className="text-sm text-slate-400 mb-6">
                     Access <strong className="text-slate-200">{model.name}</strong> securely in a dedicated pop-up window or switch to the direct chat canvas.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center w-full mb-6">
                     <button
                        onClick={() => window.open(model.url, '_blank', 'width=1200,height=800')}
                        className="flex-1 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                     >
                        <Maximize2 size={16} /> Open {model.name} in New Secure Window
                     </button>
                     <button
                        onClick={() => setMode('chat')}
                        className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
                     >
                        <MessageSquare size={16} /> Direct Chat Canvas
                     </button>
                  </div>
                  <div className="w-full pt-2 text-center">
                     <span className="inline-block px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800/80 text-slate-400 border border-slate-700/60">
                        Protected External Connection • Opens full AI experience in a secure pop-up window with Google Auth support.
                     </span>
                  </div>
               </div>
            ) : (
               <div className="flex items-center justify-center h-full bg-slate-900 text-slate-400 p-6">
                  <div className="text-center max-w-md">
                    <Globe size={48} className="mx-auto mb-4 opacity-30 text-blue-400" />
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">Web Preview Unavailable</h3>
                    <p className="text-sm">There is no interactive web view configured for <strong>{model.name}</strong> in the registry.</p>
                    <button 
                      onClick={() => setMode('chat')}
                      className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      Switch to Chat Mode
                    </button>
                  </div>
               </div>
            )}
          </div>
        ) : mode === 'chat' ? (
          <div className="p-4 h-full flex flex-col max-w-4xl mx-auto w-full">
            <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
               <input 
                  type="password" 
                  placeholder="Enter Provider API Key (BYOK) - Proxied Securely" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full sm:flex-1 p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
               />
               
               <button 
                 onClick={() => setUseLocal(!useLocal)}
                 className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${useLocal ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                 title="Run Transformers.js entirely in browser Web Worker"
               >
                 <Cpu size={14} />
                 {useLocal ? 'Local AI: ON' : 'Local AI: OFF'}
               </button>

               <button 
                 onClick={() => setDebugMode(!debugMode)}
                 className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${debugMode ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                 title="Toggle Debug Agent Thought Prefixes"
               >
                 <Bot size={14} />
                 {debugMode ? 'Debug: ON' : 'Debug: OFF'}
               </button>

               {isAuthenticated && (
                 <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-2 rounded-xl border border-emerald-500/20 whitespace-nowrap">
                   Cloud Backup ON
                 </span>
               )}
            </div>
            
            <SharedPromptEditor roomId="global-room" />

            <div className="flex-1 bg-slate-800/50 border border-slate-800 rounded-xl p-4 mt-4 overflow-y-auto mb-4 flex flex-col gap-3">
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
                  <Loader2 size={14} className="animate-spin" /> {useLocal && localAI.status === 'loading' ? `Loading Local AI Model (${Math.round(localAI.progress?.progress || 0)}%)` : 'Generating...'}
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
                  disabled={isGenerating || !prompt.trim() || useLocal}
                  title="Generate Code & Run in Sandbox"
                  className="px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors"
                >
                  <Code size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : mode === 'sandbox' ? (
          <div className="p-4 h-full flex flex-col max-w-5xl mx-auto w-full">
            <div className="mb-4">
              <h3 className="text-white font-semibold text-lg">WebContainer Sandbox (WASM CI/CD)</h3>
              <p className="text-sm text-slate-400">Instantly execute and preview generated code in a full Node.js environment running securely inside your browser.</p>
            </div>
            <WebContainerSandbox code={generatedCode} />
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
