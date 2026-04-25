import Link from 'next/link';
import { readSession } from '@/lib/auth';

export async function Navbar() {
  const session = await readSession();

  return (
    <header className="border-b border-white/10 bg-panel/60 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="inline-block w-6 h-6 bg-mc-dirt rounded-sm" />
          <span>{process.env.PUBLIC_SERVER_NAME || 'MC Server'}</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/mods" className="hover:text-accent">Моды</Link>
          <Link href="/rules" className="hover:text-accent">Правила</Link>
          <Link href="/donate" className="hover:text-accent">Донат</Link>
          {session ? (
            <>
              <Link href="/profile" className="hover:text-accent">{session.username}</Link>
              <form action="/api/logout" method="POST">
                <button className="text-white/60 hover:text-white">Выйти</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-accent">Войти</Link>
              <Link href="/register" className="btn-primary">Регистрация</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
