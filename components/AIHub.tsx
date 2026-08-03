'use client'
import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Bot, Loader2, RefreshCw, Sparkles, Filter, Globe, Zap, Radio } from 'lucide-react';
import AICard from './AICard';
import InteractionManager from './InteractionManager';
import CloudBackupModal from './CloudBackupModal';

export default function AIHub() {
    const [models, setModels] = useState<any[]>([]);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [selectedModel, setSelectedModel] = useState<any | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    
    // Auto-sync state
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
    const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
    const prevModelsLengthRef = useRef<number>(0);
    
    const tabs = ['All', 'Live Web', 'Favorites', 'General AI', 'Developer & Code', 'Research & Search', 'Roleplay & Niche', 'Creative & Media'];

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3500);
    };

    const fetchModels = useCallback(async (isAuto = false) => {
        if (!isAuto) setLoading(true);
        else setSyncing(true);

        try {
            const url = isAuto ? '/api/v1/models?autoSync=true' : '/api/v1/models';
            const res = await fetch(url);
            if (res.ok) {
                const listData = await res.json();
                
                if (isAuto && prevModelsLengthRef.current > 0 && listData.length > prevModelsLengthRef.current) {
                    const diff = listData.length - prevModelsLengthRef.current;
                    showToast(`✨ Auto-detected ${diff} new popular models from the web!`);
                }
                
                setModels(listData);
                prevModelsLengthRef.current = listData.length;
                setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            } else {
                console.error('Failed to fetch models: HTTP', res.status);
            }
        } catch (error) {
            console.error('Failed to fetch models', error);
        } finally {
            setLoading(false);
            setSyncing(false);
        }
    }, []);

    const handleSync = async () => {
        setSyncing(true);
        showToast('Scanning open web APIs for newly available popular models...');
        try {
            await fetchModels(true);
            showToast('Catalog updated with live web models!');
        } catch (error) {
            console.error('Failed to sync models', error);
            showToast('Sync completed.');
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const loadInitialData = async () => {
            const storedFavorites = localStorage.getItem('favorites');
            if (storedFavorites && isMounted) {
                try {
                    setFavorites(JSON.parse(storedFavorites));
                } catch (e) {
                    console.error('Failed to parse favorites from localStorage', e);
                }
            }
            await fetchModels(true);
        };
        loadInitialData();
        return () => { isMounted = false; };
    }, [fetchModels]);

    // Background Auto-sync polling every 45s when enabled
    useEffect(() => {
        if (!autoSyncEnabled) return;
        const interval = setInterval(() => {
            fetchModels(true);
        }, 45000);
        return () => clearInterval(interval);
    }, [autoSyncEnabled, fetchModels]);

    const toggleFavorite = (id: string) => {
        const modelId = id || '';
        const newFavorites = favorites.includes(modelId) 
            ? favorites.filter(fid => fid !== modelId)
            : [...favorites, modelId];
        setFavorites(newFavorites);
        localStorage.setItem('favorites', JSON.stringify(newFavorites));
    };

    const webCount = models.filter(m => m.isWebDiscovered || m.id?.startsWith('web-')).length;

    const filteredModels = models.filter((m: any) => {
        const mId = m.id || m.name;
        const isWeb = m.isWebDiscovered || m.id?.startsWith('web-');

        let matchesTab = true;
        if (activeTab === 'All') matchesTab = true;
        else if (activeTab === 'Live Web') matchesTab = isWeb;
        else if (activeTab === 'Favorites') matchesTab = favorites.includes(mId);
        else matchesTab = m.category === activeTab;
        
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q || 
            (m.name && m.name.toLowerCase().includes(q)) ||
            (m.description && m.description.toLowerCase().includes(q)) ||
            (m.category && m.category.toLowerCase().includes(q));

        return matchesTab && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 pb-28">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20">
                            <Bot size={28} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                                    AI Hub
                                </h1>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                                    <Globe size={11} className="animate-pulse" /> Live Auto-Sync
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-400">
                                Discover, compare, and launch interactive AI models (auto-updated from live web sources)
                            </p>
                        </div>
                    </div>

                    {/* Auto-Sync Toggle & Search Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Search models..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm transition-all min-w-[200px]"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white bg-slate-800 px-2 py-0.5 rounded"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setAutoSyncEnabled(!autoSyncEnabled);
                                    showToast(autoSyncEnabled ? 'Web Auto-Sync paused' : 'Web Auto-Sync activated!');
                                }}
                                className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                                    autoSyncEnabled 
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                                }`}
                                title="Toggle automatic background updates from web"
                            >
                                <Radio size={14} className={autoSyncEnabled ? 'animate-pulse text-emerald-400' : ''} />
                            </button>
                            
                            <button
                                onClick={() => window.dispatchEvent(new Event('open-sync-modal'))}
                                className="px-3 py-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl text-sm font-semibold hover:bg-blue-600/30 transition-all flex items-center gap-2 whitespace-nowrap"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
                                Cloud Backup
                            </button>
                        </div>
                    </div>
                </header>

                {/* Auto-Sync Status Info Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-2.5 mb-6 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${autoSyncEnabled ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${autoSyncEnabled ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                        </span>
                        <span>
                            {autoSyncEnabled 
                                ? `Web Auto-Updater active • Scanning open web APIs automatically every 45s` 
                                : `Auto-Updater paused. Toggle ON or click Sync Web Models to update.`}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 font-medium">
                        {webCount > 0 && (
                            <span className="text-cyan-400 font-semibold flex items-center gap-1">
                                <Zap size={12} /> {webCount} Web Discovered Models
                            </span>
                        )}
                        <span>Last Synced: {lastSyncTime}</span>
                    </div>
                </div>

                {/* Tabs / Filter Navigation */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto mb-8 pb-2 scrollbar-none">
                    <div className="flex gap-2">
                        {tabs.map(tab => {
                            const count = models.filter((m: any) => {
                                const mId = m.id || m.name;
                                const isWeb = m.isWebDiscovered || m.id?.startsWith('web-');
                                if (tab === 'All') return true;
                                if (tab === 'Live Web') return isWeb;
                                if (tab === 'Favorites') return favorites.includes(mId);
                                return m.category === tab;
                            }).length;

                            return (
                                <button 
                                    key={tab} 
                                    onClick={() => setActiveTab(tab)} 
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                                        activeTab === tab 
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' 
                                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800/60'
                                    }`}
                                >
                                    <span>{tab}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        activeTab === tab ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Models Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                        <p className="text-sm">Loading AI models from database...</p>
                    </div>
                ) : filteredModels.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800/80 p-8">
                        <div className="inline-flex p-3 rounded-2xl bg-slate-800/80 text-slate-400 mb-4">
                            <Filter size={24} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-200 mb-1">No AI models found</h3>
                        <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4">
                            {searchQuery ? `No results matching "${searchQuery}"` : 'No models available in this category.'}
                        </p>
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')} 
                                className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500"
                            >
                                Reset Search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                        {filteredModels.map((model: any) => {
                            const modelId = model.id || model.name;
                            return (
                                <AICard 
                                    key={modelId} 
                                    model={model} 
                                    isFavorite={favorites.includes(modelId)}
                                    onToggleFavorite={() => toggleFavorite(modelId)}
                                    onSelect={() => setSelectedModel(model)}
                                />
                            );
                        })}
                    </div>
                )}

                {/* Selected Model Modal / Interaction Manager */}
                {selectedModel && (
                    <InteractionManager 
                        model={selectedModel} 
                        onClose={() => setSelectedModel(null)}
                    />
                )}

                {/* Toast Notification */}
                {toast && (
                    <div className="fixed top-6 right-6 bg-slate-900 text-slate-100 border border-slate-700 px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <Sparkles size={16} className="text-blue-400" />
                        <span className="text-sm font-medium">{toast}</span>
                    </div>
                )}

                {/* Cloud Backup Settings Modal */}
                <CloudBackupModal />

                {/* Floating Navigation & Action Bar */}
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-slate-800 px-5 py-3 rounded-full flex items-center gap-6 shadow-2xl z-40 max-w-lg w-[calc(100%-2rem)] justify-between">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{filteredModels.length} of {models.length} models</span>
                    </div>

                    <button 
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
                        onClick={handleSync}
                        disabled={syncing}
                    >
                        <RefreshCw className={syncing ? 'animate-spin' : ''} size={15} />
                        <span>{syncing ? 'Syncing...' : 'Sync Catalog'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
