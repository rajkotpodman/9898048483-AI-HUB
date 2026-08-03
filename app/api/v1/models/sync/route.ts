import { NextRequest, NextResponse } from 'next/server';
import { syncModels } from '@/lib/services/scraper';

export async function POST(req: NextRequest) {
  try {
    const count = await syncModels();
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Sync failed', error);
    return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 });
  }
}
