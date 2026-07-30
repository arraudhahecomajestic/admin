import { NextResponse } from 'next/server';
import { sbServer } from '@/lib/sb/server';

// Callback OAuth (Google) + pengesahan emel — tukar code jadi sesi.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/portal';

  if (code) {
    const sb = sbServer();
    await sb.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
