import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.redirect(new URL('/login', req.nextUrl), { status: 303 });

  const form = await req.formData();
  const nick = String(form.get('minecraftNick') || '').trim();

  if (nick && !/^[A-Za-z0-9_]{3,32}$/.test(nick)) {
    const u = new URL('/profile', req.nextUrl);
    u.searchParams.set('error', 'Ник Minecraft: 3-32 символа, латиница/цифры/_.');
    return NextResponse.redirect(u, { status: 303 });
  }

  await prisma.user.update({
    where: { id: session.uid },
    data: { minecraftNick: nick || null },
  });

  const u = new URL('/profile', req.nextUrl);
  u.searchParams.set('saved', '1');
  return NextResponse.redirect(u, { status: 303 });
}
