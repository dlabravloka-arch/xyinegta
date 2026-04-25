export const metadata = { title: 'Платежи в настройке' };

export default function SetupRequired() {
  return (
    <div className="max-w-xl mx-auto card text-center">
      <h1 className="text-2xl font-bold mb-3">Платежи ещё не настроены</h1>
      <p className="text-white/70 mb-4">
        Спасибо что хочешь поддержать! Админ ещё не подключил платёжную систему. Запиши намерение
        в Discord — мы вручную пришлём реквизиты и выдадим плюшки.
      </p>
      <p className="text-sm text-white/50">
        (Для админа: задай <code>STRIPE_SECRET_KEY</code> и <code>STRIPE_PRICE_ID_*</code> в
        .env чтобы включить автоматические платежи.)
      </p>
      <a className="btn-primary mt-6 inline-flex" href="/">На главную</a>
    </div>
  );
}
