import { NextResponse } from 'next/server';
import models from '@/data/models.json';

export async function GET() {
  return NextResponse.json(models);
}
