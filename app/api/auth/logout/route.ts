import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, revokeSessionByRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await revokeSessionByRequest(request);
    const response = NextResponse.json({ ok: true });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
