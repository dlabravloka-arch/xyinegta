import { NextResponse } from 'next/server';
import { getServerStatus } from '@/lib/mc-status';

export const dynamic = 'force-dynamic';

export async function GET() {
  const s = await getServerStatus();
  return NextResponse.json(s);
}
