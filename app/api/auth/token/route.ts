import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { accessToken } = await req.json();
  
  const cookieStore = await cookies();
  cookieStore.set('google_drive_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600, // 1 hour (Google access tokens usually expire in 1 hr)
  });

  return NextResponse.json({ success: true });
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('google_drive_token')?.value;
  return NextResponse.json({ token: token || null });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('google_drive_token');
  return NextResponse.json({ success: true });
}
