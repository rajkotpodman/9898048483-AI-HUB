import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

let supabaseClient: any = null;

function getSupabase() {
    if (!supabaseClient) {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
            throw new Error('Supabase configuration missing');
        }
        supabaseClient = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_KEY
        );
    }
    return supabaseClient;
}

export interface AIModel {
  title: string;
  category: 'Code' | 'Research' | 'General' | 'Creative';
  accent_color: string;
  url: string;
  description: string;
}

export async function scrapeAIModels(): Promise<AIModel[]> {
  const models: AIModel[] = [];

  // 1. OpenRouter
  try {
    const response = await axios.get('https://openrouter.ai/api/v1/models');
    if (response.data && response.data.data) {
        response.data.data.slice(0, 5).forEach((m: any) => {
            models.push({
                title: m.name,
                category: 'General',
                accent_color: '#3b82f6',
                url: `https://openrouter.ai/models/${m.id}`,
                description: m.description || 'No description available'
            });
        });
    }
  } catch (e) {
    console.error('Error fetching OpenRouter', e);
  }

  // Add more scrapers here...

  return models;
}

export async function syncModels() {
  const models = await scrapeAIModels();
  
  if (models.length === 0) return 0;

  const { error } = await getSupabase().from('models').upsert(models);
  if (error) {
    console.error('Error syncing models to Supabase', error);
    throw error;
  }
  
  return models.length;
}
