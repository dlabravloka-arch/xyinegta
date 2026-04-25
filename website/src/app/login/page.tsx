import { redirect } from 'next/navigation';
import { readSession } from '@/lib/auth';

export const metadata = { title: 'Вход' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  if (await readSession()) redirect('/profile');

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <h1 className="text-2xl font-bold mb-1">Вход</h1>
        <p className="text-sm text-white/60 mb-6">
          Нет аккаунта? <a href="/register" className="text-accent hover:underline">Зарегистрироваться</a>
        </p>

        <form action="/api/login" method="POST" className="space-y-4">
          <div>
            <label className="label">Логин или email</label>
            <input className="input" type="text" name="identifier" required autoComplete="username" />
          </div>
          <div>
            <label className="label">Пароль</label>
            <input className="input" type="password" name="password" required autoComplete="current-password" />
          </div>

          {searchParams.error && (
            <p className="text-red-400 text-sm">{decodeURIComponent(searchParams.error)}</p>
          )}

          <button type="submit" className="btn-primary w-full">Войти</button>
        </form>
      </div>
    </div>
  );
}
