import { ServerStatusCard } from '@/components/ServerStatusCard';
import { CopyAddress } from '@/components/CopyAddress';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function Home() {
  const address = process.env.PUBLIC_SERVER_ADDRESS || process.env.MC_HOST || 'mc.example.com';
  const serverName = process.env.PUBLIC_SERVER_NAME || 'Minecraft Server';

  return (
    <div className="space-y-12">
      <section className="text-center py-16">
        <div className="inline-block bg-mc-dirt rounded-lg p-2 mb-6">
          <div className="bg-panel/80 rounded-md px-6 py-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{serverName}</h1>
            <p className="text-white/60 mt-2">Minecraft Java · Fabric 1.21 · С модами оптимизации</p>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-white/70">Адрес сервера — вставь в клиент Minecraft:</p>
          <CopyAddress address={address} />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <ServerStatusCard />
        <div className="card">
          <h2 className="text-xl font-bold mb-3">Как зайти</h2>
          <ol className="space-y-2 text-white/80 list-decimal list-inside">
            <li>Запусти Minecraft Java Edition <strong>1.21.1</strong> (любой клиент)</li>
            <li>Multiplayer → Add Server</li>
            <li>В поле <em>Server Address</em> вставь: <code className="bg-ink px-2 py-0.5 rounded">{address}</code></li>
            <li>Жми Done и подключайся!</li>
          </ol>
          <p className="text-sm text-white/50 mt-4">
            Моды на клиенте ставить не нужно — все моды на сервере серверные. Если хочешь ускорить и свой клиент,
            поставь <a className="text-accent hover:underline" href="https://modrinth.com/mod/sodium" target="_blank">Sodium</a>.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/mods" className="card hover:border-accent/40 transition">
          <h3 className="text-lg font-bold mb-2">⚡ Моды</h3>
          <p className="text-white/70 text-sm">15+ модов: оптимизация, удобства, фишки. Без ломания ваниллы.</p>
        </Link>
        <Link href="/rules" className="card hover:border-accent/40 transition">
          <h3 className="text-lg font-bold mb-2">📜 Правила</h3>
          <p className="text-white/70 text-sm">Краткие, чёткие, чтобы все играли в кайф.</p>
        </Link>
        <Link href="/donate" className="card hover:border-accent/40 transition">
          <h3 className="text-lg font-bold mb-2">💚 Поддержать</h3>
          <p className="text-white/70 text-sm">Хостинг, поддержка, новые карты — ребята живут на пожертвования.</p>
        </Link>
      </section>
    </div>
  );
}
