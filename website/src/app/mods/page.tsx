import { MODS } from '@/lib/mods-data';

export const metadata = { title: 'Моды — Minecraft Server' };

export default function ModsPage() {
  const perf = MODS.filter((m) => m.category === 'perf');
  const fun = MODS.filter((m) => m.category === 'fun');

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold">Моды на сервере</h1>
        <p className="text-white/60 mt-2">
          Все моды server-side совместимы — клиент ставить ничего не обязан. Установи только
          {' '}<a className="text-accent hover:underline" href="https://modrinth.com/mod/sodium" target="_blank">Sodium</a>{' '}
          в клиент чтобы у тебя самого FPS вырос.
        </p>
      </header>

      <Section title="⚡ Оптимизация" mods={perf} />
      <Section title="🎲 Геймплей" mods={fun} />
    </div>
  );
}

function Section({ title, mods }: { title: string; mods: typeof MODS }) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {mods.map((m) => (
          <a
            key={m.slug}
            href={`https://modrinth.com/mod/${m.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="card hover:border-accent/40 transition block"
          >
            <div className="flex items-baseline justify-between mb-1">
              <h3 className="font-bold">{m.name}</h3>
              <code className="text-xs text-white/40">{m.slug}</code>
            </div>
            <p className="text-sm text-white/70">{m.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
