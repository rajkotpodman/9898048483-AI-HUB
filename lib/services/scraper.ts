
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import localModels from '@/data/models.json';

// In-memory cache for fast auto-syncing
let cachedMergedModels: any[] = [];
let lastSyncTimestamp: number = 0;

export async function scrapeModels(forceRefresh = false) {
    // Return cached list if synced recently (within 2 minutes) unless forceRefresh is true
    const now = Date.now();
    if (!forceRefresh && cachedMergedModels.length > 0 && (now - lastSyncTimestamp < 120000)) {
        return cachedMergedModels;
    }

    let webDiscoveredModels: any[] = [];

    try {
        // Fetch top popular models from OpenRouter API (No key required for list endpoint)
        const response = await axios.get('https://openrouter.ai/api/v1/models', { timeout: 6000 });
        if (response.data && Array.isArray(response.data.data)) {
            const rawList = response.data.data;

            // Pick popular/top models and format them
            webDiscoveredModels = rawList.slice(0, 25).map((m: any) => {
                const idLower = (m.id || '').toLowerCase();
                const nameLower = (m.name || '').toLowerCase();

                // Categorize based on model attributes
                let category = 'General AI';
                let color = 'bg-blue-500';

                if (idLower.includes('code') || idLower.includes('coder') || idLower.includes('dev') || idLower.includes('starcoder')) {
                    category = 'Developer & Code';
                    color = 'bg-emerald-500';
                } else if (idLower.includes('flux') || idLower.includes('stable') || idLower.includes('image') || idLower.includes('midjourney') || idLower.includes('suno') || idLower.includes('runway')) {
                    category = 'Creative & Media';
                    color = 'bg-purple-500';
                } else if (idLower.includes('deepseek') || idLower.includes('math') || idLower.includes('paper') || idLower.includes('research') || idLower.includes('perplexity')) {
                    category = 'Research & Search';
                    color = 'bg-cyan-500';
                } else if (idLower.includes('roleplay') || idLower.includes('mythomax') || idLower.includes('wizard') || idLower.includes('character')) {
                    category = 'Roleplay & Niche';
                    color = 'bg-amber-500';
                } else if (idLower.includes('claude') || idLower.includes('gpt') || idLower.includes('gemini') || idLower.includes('llama')) {
                    category = 'General AI';
                    color = idLower.includes('claude') ? 'bg-orange-500' : idLower.includes('gemini') ? 'bg-pink-500' : 'bg-blue-600';
                }

                // Format description with context window & pricing if available
                const contextK = m.context_length ? `${Math.round(m.context_length / 1024)}k context` : '';
                const baseDesc = m.description || `Popular AI model discovered from live web updates.`;
                const fullDesc = contextK ? `[${contextK}] ${baseDesc}` : baseDesc;

                return {
                    id: `web-${m.id.replace(/[\/:]/g, '-')}`,
                    name: m.name || m.id,
                    category,
                    color,
                    description: fullDesc,
                    isWebDiscovered: true,
                    isNew: true,
                    discoveredAt: new Date().toISOString(),
                    contextLength: m.context_length,
                    openRouterId: m.id
                };
            });
        }
    } catch (err: any) {
        console.warn('Live web model fetching warning:', err.message || err);
    }

    // Merge with local static catalog, avoiding duplicates by normalized name
    const existingNames = new Set(localModels.map((m: any) => m.name.toLowerCase().trim()));
    
    const uniqueWebModels = webDiscoveredModels.filter((wm: any) => {
        const normName = wm.name.toLowerCase().trim();
        return !existingNames.has(normName);
    });

    const allModels = [...uniqueWebModels, ...localModels];

    // Try persisting to Supabase if configured
    try {
        const { error } = await supabase.from('models').upsert(allModels);
        if (error) console.warn('Supabase sync warning:', error.message);
    } catch (e) {
        console.warn('Supabase not active or unreachable:', e);
    }

    cachedMergedModels = allModels;
    lastSyncTimestamp = Date.now();

    return allModels;
}

export function getCachedModels() {
    return cachedMergedModels.length > 0 ? cachedMergedModels : localModels;
}

