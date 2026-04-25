import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession, setSessionCookie } from '@/lib/auth';

function back(url: URL, error: string) {
  const u = new URL('/login', url);
  u.searchParams.set('error', error);
  return NextResponse.redirect(u, { status: 303 });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const identifier = String(form.get('identifier') || '').trim();
  const password = String(form.get('password') || '');

  if (!identifier || !password) {
    return back(req.nextUrl, 'Заполни все поля.');
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
  });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return back(req.nextUrl, 'Неверный логин или пароль.');
  }

  const token = await createSession({ uid: user.id, username: user.username, role: user.role });
  setSessionCookie(token);

  return NextResponse.redirect(new URL('/profile', req.nextUrl), { status: 303 });
}
