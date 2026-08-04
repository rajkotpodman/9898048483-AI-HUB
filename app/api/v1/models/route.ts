import { NextRequest, NextResponse } from 'next/server';
import { scrapeModels } from '@/lib/services/scraper';
import fallbackModels from '@/data/models.json';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const autoSync = searchParams.get('autoSync') === 'true' || searchParams.get('sync') === '1';
    const models = await scrapeModels(autoSync);
    return NextResponse.json(models && models.length > 0 ? models : fallbackModels);
  } catch (e) {
    return NextResponse.json(fallbackModels);
  }
}


