import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const metadata = { title: 'Профиль' };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const donations = await prisma.donation.findMany({
    where: { userId: user.id, status: 'succeeded' },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const total = donations.reduce((acc, d) => acc + d.amount, 0);

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <h1 className="text-3xl font-bold">Привет, {user.username}</h1>
        <p className="text-white/60">Здесь твои данные и история донатов.</p>
      </header>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">Профиль</h2>
        <form action="/api/profile" method="POST" className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={user.email} disabled />
          </div>
          <div>
            <label className="label">Логин</label>
            <input className="input" type="text" value={user.username} disabled />
          </div>
          <div>
            <label className="label">Ник в Minecraft</label>
            <input
              className="input"
              type="text"
              name="minecraftNick"
              defaultValue={user.minecraftNick ?? ''}
              maxLength={32}
              pattern="[A-Za-z0-9_]*"
              placeholder="например Steve"
            />
            <p className="text-xs text-white/40 mt-1">
              Привяжи ник чтобы получать плюшки от донатов автоматически.
            </p>
          </div>
          {searchParams.saved && <p className="text-accent text-sm">Сохранено!</p>}
          {searchParams.error && <p className="text-red-400 text-sm">{decodeURIComponent(searchParams.error)}</p>}
          <button type="submit" className="btn-primary">Сохранить</button>
        </form>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">Донаты</h2>
        {donations.length === 0 ? (
          <p className="text-white/60 text-sm">Пока пусто. <a className="text-accent hover:underline" href="/donate">Поддержать сервер →</a></p>
        ) : (
          <>
            <p className="text-sm text-white/60 mb-3">Всего поддержано: <strong className="text-accent">{total} ₽</strong></p>
            <ul className="divide-y divide-white/10">
              {donations.map((d) => (
                <li key={d.id} className="py-2 flex justify-between text-sm">
                  <span>{d.createdAt.toLocaleDateString('ru-RU')}</span>
                  <span className="font-mono">{d.amount} {d.currency}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
