'use client'
import { useState } from 'react';
import { Search, SlidersHorizontal, Bot } from 'lucide-react';
import AICard from './AICard';

const aiServices = [
    { id: 'janitor-ai', name: 'Janitor AI', color: 'bg-green-500', category: 'Uncensored/Roleplay', isFavorite: false },
    { id: 'deep-hat', name: 'Deep Hat', color: 'bg-yellow-500', category: 'Research', isFavorite: false },
    { id: 'wormgpt', name: 'WormGPT', color: 'bg-pink-500', category: 'Coding', isFavorite: false },
    { id: 'chub-ai', name: 'Chub AI', color: 'bg-yellow-500', category: 'Uncensored/Roleplay', isFavorite: false },
    { id: 'deepshi', name: 'Deepshi', color: 'bg-yellow-500', category: 'Research', isFavorite: false },
    { id: 'saucepan-ai', name: 'Saucepan AI', color: 'bg-purple-500', category: 'Coding', isFavorite: false },
    { id: 'tinfoil', name: 'Tinfoil', color: 'bg-pink-500', category: 'Uncensored/Roleplay', isFavorite: false },
    { id: 'tinfoil-chat', name: 'Tinfoil Private Chat', color: 'bg-orange-400', category: 'Uncensored/Roleplay', isFavorite: false },
    { id: 'agnai-chat', name: 'Agnai Chat', color: 'bg-blue-500', category: 'Uncensored/Roleplay', isFavorite: false },
    { id: 'cursor-agents', name: 'Cursor Agents', color: 'bg-purple-500', category: 'Coding', isFavorite: false },
    { id: 'augure-chat', name: 'Augure Chat', color: 'bg-pink-500', category: 'Uncensored/Roleplay', isFavorite: false },
    { id: 'nastia', name: 'Nastia', color: 'bg-pink-500', category: 'Uncensored/Roleplay', isFavorite: false },
    { id: 'uncensored-chat', name: 'Uncensored Chat', color: 'bg-green-500', category: 'Uncensored/Roleplay', isFavorite: false },
    { id: 'amazonia-ia', name: 'Amazônia IA', color: 'bg-pink-500', category: 'Uncensored/Roleplay', isFavorite: false },
    { id: 'litero-ai', name: 'Litero AI', color: 'bg-pink-500', category: 'Research', isFavorite: false },
    { id: 'command-code', name: 'Command Code', color: 'bg-green-500', category: 'Coding', isFavorite: false },
    { id: 'prompt-optimizer', name: 'Prompt Optimizer', color: 'bg-green-500', category: 'Coding', isFavorite: false },
    { id: 'google-labs', name: 'Google Labs', color: 'bg-yellow-500', category: 'Research', isFavorite: false },
    { id: 'google', name: 'Google', color: 'bg-yellow-500', category: 'Research', isFavorite: false },
    { id: 'minimax', name: 'MiniMax', color: 'bg-yellow-500', category: 'Research', isFavorite: false },
    { id: 'sci-bot', name: 'Sci Bot', color: 'bg-yellow-500', category: 'Research', isFavorite: false },
    { id: 'okara', name: 'Okara', color: 'bg-yellow-500', category: 'Research', isFavorite: false },
    { id: 'obscurify-ai', name: 'Obscurify AI', color: 'bg-green-500', category: 'Research', isFavorite: false },
    { id: 'kagi', name: 'Kagi', color: 'bg-blue-500', category: 'Research', isFavorite: false },
    { id: 'maple-ai', name: 'Maple AI', color: 'bg-pink-500', category: 'Research', isFavorite: false },
    { id: 'hacker-ai', name: 'Hacker AI', color: 'bg-purple-500', category: 'Coding', isFavorite: false },
    { id: 'ellydee', name: 'Ellydee', color: 'bg-yellow-500', category: 'Research', isFavorite: false },
    { id: 'poe', name: 'Poe', color: 'bg-green-500', category: 'Research', isFavorite: false },
    { id: 'paperguide-ai', name: 'Paperguide AI', color: 'bg-yellow-500', category: 'Research', isFavorite: false },
    { id: 'genspark-ai', name: 'Genspark AI', color: 'bg-pink-500', category: 'Research', isFavorite: false },
    { id: 'manus', name: 'Manus', color: 'bg-pink-500', category: 'Coding', isFavorite: false },
    { id: 'character-ai', name: 'Character AI', color: 'bg-green-500', category: 'Uncensored/Roleplay', isFavorite: false },
    { id: 'thaura', name: 'Thaura', color: 'bg-blue-500', category: 'Uncensored/Roleplay', isFavorite: false },
    { id: 'xprivo', name: 'xPrivo', color: 'bg-pink-500', category: 'Uncensored/Roleplay', isFavorite: false },
    { id: 'mimo-studio', name: 'MiMo Studio', color: 'bg-purple-500', category: 'Coding', isFavorite: false },
    { id: 'confer', name: 'Confer', color: 'bg-teal-500', category: 'Research', isFavorite: false },
    { id: 'perplexity', name: 'Perplexity', color: 'bg-pink-500', category: 'Research', isFavorite: false },
    { id: 'mistral', name: 'Mistral', color: 'bg-pink-500', category: 'Research', isFavorite: false },
    { id: 'blackbox', name: 'Blackbox', color: 'bg-teal-500', category: 'Coding', isFavorite: false },
    { id: 'euria', name: 'Euria', color: 'bg-pink-500', category: 'Uncensored/Roleplay', isFavorite: false },
    { id: 'gpai', name: 'GPai', color: 'bg-blue-500', category: 'Coding', isFavorite: false },
    { id: 'openrouter-chat', name: 'OpenRouter Chat', color: 'bg-yellow-500', category: 'Coding', isFavorite: false },
    { id: 'secai', name: 'SecAI', color: 'bg-pink-500', category: 'Uncensored/Roleplay', isFavorite: false },
    { id: 'mammouth-ai', name: 'Mammouth AI', color: 'bg-green-500', category: 'Research', isFavorite: false },
    { id: 'kimi', name: 'Kimi', color: 'bg-green-500', category: 'Research', isFavorite: false },
    { id: 'copilot-365', name: 'Copilot 365', color: 'bg-green-500', category: 'Coding', isFavorite: false },
    { id: 'stepfun', name: 'StepFun', color: 'bg-green-500', category: 'Coding', isFavorite: false },
    { id: 'uncensored-ai', name: 'Uncensored AI', color: 'bg-purple-500', category: 'Uncensored/Roleplay', isFavorite: false },
    { id: 'minara', name: 'Minara', color: 'bg-green-500', category: 'Uncensored/Roleplay', isFavorite: false },
    { id: 'spicychat', name: 'Spicychat', color: 'bg-teal-500', category: 'Uncensored/Roleplay', isFavorite: false },
    { id: 'alice-ai', name: 'Alice AI', color: 'bg-green-500', category: 'Uncensored/Roleplay', isFavorite: false },
    { id: 'gigachat', name: 'Gigachat', color: 'bg-pink-500', category: 'Research', isFavorite: false },
    { id: 'deep-ai', name: 'Deep AI', color: 'bg-orange-400', category: 'Research', isFavorite: false },
    { id: 'base44', name: 'Base44', color: 'bg-orange-400', category: 'Coding', isFavorite: false },
    { id: 'duck-ai', name: 'Duck AI', color: 'bg-green-500', category: 'Research', isFavorite: false },
    { id: 'venice', name: 'Venice', color: 'bg-pink-500', category: 'Uncensored/Roleplay', isFavorite: false },
    { id: 'grok', name: 'Grok', color: 'bg-blue-500', category: 'Research', isFavorite: false },
    { id: 'lumo', name: 'Lumo', color: 'bg-green-500', category: 'Research', isFavorite: false },
    { id: 'chatgpt', name: 'ChatGPT', color: 'bg-green-500', category: 'Research', isFavorite: false },
    { id: 'gemini', name: 'Gemini', color: 'bg-pink-500', category: 'Research', isFavorite: false },
    { id: 'google-ai-studio', name: 'Google Ai Studio', color: 'bg-yellow-500', category: 'Coding', isFavorite: false },
    { id: 'claude', name: 'Claude', color: 'bg-orange-500', category: 'Research', isFavorite: false },
];

export default function AIHub() {
    const [activeTab, setActiveTab] = useState('All');
    const tabs = ['All', 'Favorites', 'Coding', 'Uncensored/Roleplay', 'Research'];
    
    const filteredModels = aiServices.filter(m => activeTab === 'All' || m.category === activeTab);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 pb-24 max-w-2xl mx-auto">
          {/* Header */}
          <header className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-blue-500 p-2 rounded-full"><Bot /></div>
              <h1 className="text-xl font-bold">9898048483 AI Hub</h1>
            </div>
            <div className="flex gap-4">
              <Search />
              <SlidersHorizontal />
              <div className="w-8 h-8 rounded-full bg-gray-700" />
            </div>
          </header>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
            {tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-full whitespace-nowrap ${activeTab === tab ? 'bg-blue-600' : 'bg-gray-800'}`}>
                    {tab}
                </button>
            ))}
          </div>

          {/* List */}
          <div className="space-y-3">
            {filteredModels.map(model => (
              <AICard key={model.id} model={model} />
            ))}
          </div>

          {/* Floating Bar */}
          <div className="fixed bottom-4 left-4 right-4 bg-gray-800 p-4 rounded-full flex justify-between items-center max-w-2xl mx-auto">
            <span className="text-sm">63 Update AI & services</span>
            <button className="bg-blue-600 px-4 py-2 rounded-full text-sm">Update</button>
          </div>
        </div>
    )
}
