import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSession, setSessionCookie } from '@/lib/auth';

const Schema = z.object({
  email: z.string().email().max(200),
  username: z.string().min(3).max(32).regex(/^[A-Za-z0-9_]+$/),
  minecraftNick: z.string().max(32).regex(/^[A-Za-z0-9_]*$/).optional(),
  password: z.string().min(8).max(200),
});

function back(url: URL, error: string) {
  const u = new URL('/register', url);
  u.searchParams.set('error', error);
  return NextResponse.redirect(u, { status: 303 });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const parsed = Schema.safeParse({
    email: form.get('email'),
    username: form.get('username'),
    minecraftNick: form.get('minecraftNick') || undefined,
    password: form.get('password'),
  });

  if (!parsed.success) {
    return back(req.nextUrl, 'Проверь поля: email, логин (3-32, латиница/цифры/_), пароль ≥ 8.');
  }

  const { email, username, minecraftNick, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    return back(req.nextUrl, 'Email или логин уже занят.');
  }

  const user = await prisma.user.create({
    data: {
      email,
      username,
      minecraftNick: minecraftNick || null,
      passwordHash: await hashPassword(password),
    },
  });

  const token = await createSession({ uid: user.id, username: user.username, role: user.role });
  setSessionCookie(token);

  return NextResponse.redirect(new URL('/profile', req.nextUrl), { status: 303 });
}
