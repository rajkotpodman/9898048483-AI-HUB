
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
        // Fetch full 160+ models from the user's Android config URL
        const response = await axios.get('https://silentcoderhere.github.io/aihub-config-data/ais.json', { timeout: 8000 });
        if (response.data) {
            let rawList: any[] = [];
            if (Array.isArray(response.data)) {
                rawList = response.data;
            } else if (typeof response.data === 'object' && response.data !== null) {
                for (const key of Object.keys(response.data)) {
                    if (Array.isArray(response.data[key])) {
                        for (const item of response.data[key]) {
                            rawList.push({ ...item, categoryTag: key });
                        }
                    }
                }
            }

            if (rawList.length > 0) {
                webDiscoveredModels = rawList.map((m: any, index: number) => {
                    const id = m.id || m.modelId || m.name || `model-${index}`;
                    const name = m.name || m.title || id;
                    const idLower = String(id).toLowerCase();
                    const tagLower = String(m.categoryTag || '').toLowerCase();

                    let category = m.category || 'General AI';
                    let color = m.color || 'bg-blue-500';

                    if (tagLower.includes('code') || idLower.includes('code') || idLower.includes('coder') || idLower.includes('dev')) {
                        category = 'Developer & Code';
                        color = 'bg-emerald-500';
                    } else if (tagLower.includes('image') || tagLower.includes('video') || tagLower.includes('music') || tagLower.includes('voice') || tagLower.includes('media') || idLower.includes('flux') || idLower.includes('stable') || idLower.includes('image') || idLower.includes('suno') || idLower.includes('runway')) {
                        category = 'Creative & Media';
                        color = 'bg-purple-500';
                    } else if (tagLower.includes('research') || tagLower.includes('writing') || tagLower.includes('translator') || idLower.includes('deepseek') || idLower.includes('math') || idLower.includes('research') || idLower.includes('perplexity')) {
                        category = 'Research & Search';
                        color = 'bg-cyan-500';
                    } else if (tagLower.includes('presentation') || idLower.includes('roleplay') || idLower.includes('mythomax') || idLower.includes('wizard')) {
                        category = 'Roleplay & Niche';
                        color = 'bg-amber-500';
                    } else if (idLower.includes('claude') || idLower.includes('gpt') || idLower.includes('gemini') || idLower.includes('llama')) {
                        category = 'General AI';
                        color = idLower.includes('claude') ? 'bg-orange-500' : idLower.includes('gemini') ? 'bg-pink-500' : 'bg-blue-600';
                    }

                    return {
                        id: `web-${String(id).replace(/[\/:]/g, '-')}-${index}`,
                        name,
                        category,
                        color,
                        description: m.description || (Array.isArray(m.best_for) ? `Best for: ${m.best_for.join(', ')}` : '') || `Popular AI model synced from remote config (${m.categoryTag || 'catalog'}).`,
                        url: m.url || m.website || `https://openrouter.ai/models/${id}`,
                        isWebDiscovered: true,
                        isNew: true,
                        discoveredAt: new Date().toISOString(),
                        ...m
                    };
                });
            }
        }
    } catch (err: any) {
        console.warn('Config JSON model fetching warning:', err.message || err);
    }

    // Merge with local static catalog, avoiding duplicates by normalized name
    const existingNames = new Set(localModels.map((m: any) => m.name.toLowerCase().trim()));
    
    const uniqueWebModels = webDiscoveredModels.filter((wm: any) => {
        const normName = wm.name.toLowerCase().trim();
        return !existingNames.has(normName);
    });

    const allModels = webDiscoveredModels.length > 0 ? [...uniqueWebModels, ...localModels] : localModels;

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

