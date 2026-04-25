import { readSession } from '@/lib/auth';

export const metadata = { title: 'Поддержать сервер' };

const TIERS: { id: string; amount: number; label: string; perks: string[] }[] = [
  {
    id: '5',
    amount: 200,
    label: 'Друг',
    perks: ['Цветной ник в чате', 'Спасибо в Discord', 'Доступ к /sethome 2'],
  },
  {
    id: '10',
    amount: 500,
    label: 'Спонсор',
    perks: ['Всё из «Друг»', '/fly в спавне', 'Кастомный префикс', '/sethome 5'],
  },
  {
    id: '25',
    amount: 1500,
    label: 'Меценат',
    perks: ['Всё из «Спонсор»', 'Личный регион 100×100', 'Свой particle-эффект', 'Голос в выборе ивентов'],
  },
];

export default async function DonatePage() {
  const session = await readSession();

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold">Поддержать сервер</h1>
        <p className="text-white/60 mt-2 max-w-2xl">
          Хостинг, бэкапы, новые карты и ивенты держатся на ваших донатах. Спасибо что помогаешь —
          без подписки, можно один раз и навсегда.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {TIERS.map((t) => (
          <div key={t.id} className="card flex flex-col">
            <h3 className="text-2xl font-bold mb-1">{t.label}</h3>
            <p className="text-3xl font-mono mb-4">
              {t.amount} <span className="text-base text-white/50">₽</span>
            </p>
            <ul className="space-y-1 text-sm text-white/80 mb-6 flex-1">
              {t.perks.map((p) => (
                <li key={p}>• {p}</li>
              ))}
            </ul>
            <form action="/api/donate/checkout" method="POST">
              <input type="hidden" name="tier" value={t.id} />
              <button className="btn-primary w-full" type="submit">
                Поддержать
              </button>
            </form>
          </div>
        ))}
      </div>

      {!session && (
        <p className="text-sm text-white/50">
          Войди в аккаунт чтобы привязать донат к нику и получить плюшки автоматически.
        </p>
      )}

      <div className="card">
        <h2 className="text-lg font-bold mb-2">Как это работает</h2>
        <ol className="space-y-2 text-white/80 list-decimal list-inside text-sm">
          <li>Жми «Поддержать» — открывается безопасная страница оплаты.</li>
          <li>После оплаты ты получишь email с подтверждением.</li>
          <li>Привилегии выдаются автоматически в течение 5 минут (если ник привязан).</li>
        </ol>
      </div>
    </div>
  );
}
