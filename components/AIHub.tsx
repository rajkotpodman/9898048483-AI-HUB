'use client'
import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Bot, Loader2 } from 'lucide-react';
import AICard from './AICard';

export default function AIHub() {
    const [models, setModels] = useState<any[]>([]);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState('All');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    
    const tabs = ['All', 'Favorites', 'General AI', 'Developer & Code', 'Research & Search', 'Roleplay & Niche'];

    const fetchModels = async () => {
        setLoading(true);
        setToast('Fetching latest AI services...');
        try {
            const res = await globalThis.fetch('/api/v1/models');
            const data = await res.json();
            setModels(data);
        } catch (error) {
            console.error('Failed to fetch models', error);
        } finally {
            setLoading(false);
            setToast(null);
        }
    };

    useEffect(() => {
        const init = async () => {
            await fetchModels();
            const storedFavorites = localStorage.getItem('favorites');
            if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
        };
        init();
    }, []);

    const toggleFavorite = (id: string) => {
        const newFavorites = favorites.includes(id) 
            ? favorites.filter(fid => fid !== id)
            : [...favorites, id];
        setFavorites(newFavorites);
        localStorage.setItem('favorites', JSON.stringify(newFavorites));
    };

    const filteredModels = models.filter((m: any) => {
        if (activeTab === 'All') return true;
        if (activeTab === 'Favorites') return favorites.includes(m.id);
        return m.category === activeTab;
    });

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
            {filteredModels.map((model: any) => (
              <AICard 
                key={model.id} 
                model={model} 
                isFavorite={favorites.includes(model.id)}
                onToggleFavorite={() => toggleFavorite(model.id)}
              />
            ))}
          </div>

          {toast && (
            <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50">
              {toast}
            </div>
          )}

          {/* Floating Bar */}
          <div className="fixed bottom-4 left-4 right-4 bg-gray-800 p-4 rounded-full flex justify-between items-center max-w-2xl mx-auto">
            <span className="text-sm">{models.length} AI & services</span>
            <button 
              className="bg-blue-600 px-4 py-2 rounded-full text-sm flex items-center gap-2"
              onClick={fetchModels}
              disabled={loading}
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              Update
            </button>
          </div>
        </div>
    )
}
