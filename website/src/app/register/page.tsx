import { redirect } from 'next/navigation';
import { readSession } from '@/lib/auth';

export const metadata = { title: 'Регистрация' };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  if (await readSession()) redirect('/profile');

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <h1 className="text-2xl font-bold mb-1">Регистрация</h1>
        <p className="text-sm text-white/60 mb-6">
          Уже есть аккаунт? <a href="/login" className="text-accent hover:underline">Войти</a>
        </p>

        <form action="/api/register" method="POST" className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" name="email" required autoComplete="email" />
          </div>
          <div>
            <label className="label">Логин на сайте</label>
            <input className="input" type="text" name="username" required minLength={3} maxLength={32} pattern="[A-Za-z0-9_]+" />
          </div>
          <div>
            <label className="label">Ник в Minecraft <span className="text-white/40 text-xs">(не обязательно)</span></label>
            <input className="input" type="text" name="minecraftNick" maxLength={32} pattern="[A-Za-z0-9_]+" />
          </div>
          <div>
            <label className="label">Пароль</label>
            <input className="input" type="password" name="password" required minLength={8} autoComplete="new-password" />
          </div>

          {searchParams.error && (
            <p className="text-red-400 text-sm">{decodeURIComponent(searchParams.error)}</p>
          )}

          <button type="submit" className="btn-primary w-full">Создать аккаунт</button>
        </form>
      </div>
    </div>
  );
}
