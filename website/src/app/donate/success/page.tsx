export const metadata = { title: 'Спасибо!' };

export default function DonateSuccess() {
  return (
    <div className="max-w-xl mx-auto card text-center">
      <h1 className="text-3xl font-bold mb-3">💚 Спасибо!</h1>
      <p className="text-white/70">
        Платёж принят. Привилегии будут выданы автоматически в течение нескольких минут.
        Если что-то не так — напиши админу в Discord.
      </p>
      <a className="btn-primary mt-6 inline-flex" href="/">На главную</a>
    </div>
  );
}
