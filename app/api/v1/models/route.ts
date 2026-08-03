import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fallbackModels from '@/data/models.json';
import { scrapeModels } from '@/lib/services/scraper';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const autoSync = searchParams.get('autoSync') === 'true' || searchParams.get('sync') === '1';

  try {
    // If autoSync requested, trigger scrape/merge from web
    if (autoSync) {
      const liveModels = await scrapeModels(true);
      return NextResponse.json(liveModels);
    }

    // Try Supabase first
    const { data, error } = await supabase.from('models').select('*');
    if (!error && data && data.length > 0) {
      return NextResponse.json(data);
    }
  } catch (err) {
    console.warn('Supabase/Live query failed, falling back:', err);
  }

  // Otherwise, automatically attempt live web update or fallback catalog
  try {
    const liveModels = await scrapeModels(false);
    return NextResponse.json(liveModels);
  } catch (e) {
    return NextResponse.json(fallbackModels);
  }
}

