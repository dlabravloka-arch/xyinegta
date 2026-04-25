import { getServerStatus } from '@/lib/mc-status';

export async function ServerStatusCard() {
  const s = await getServerStatus();
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Статус сервера</h2>
        <span
          className={`inline-flex items-center gap-2 text-sm font-mono ${
            s.online ? 'text-accent' : 'text-red-400'
          }`}
        >
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              s.online ? 'bg-accent animate-pulse' : 'bg-red-400'
            }`}
          />
          {s.online ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-white/50">Адрес</dt>
          <dd className="font-mono">{s.host}{s.port !== 25565 ? `:${s.port}` : ''}</dd>
        </div>
        {s.online ? (
          <>
            <div className="flex justify-between">
              <dt className="text-white/50">Игроков</dt>
              <dd className="font-mono">{s.players?.online ?? 0} / {s.players?.max ?? 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/50">Версия</dt>
              <dd className="font-mono">{s.version}</dd>
            </div>
            {typeof s.latencyMs === 'number' && (
              <div className="flex justify-between">
                <dt className="text-white/50">Пинг</dt>
                <dd className="font-mono">{s.latencyMs} мс</dd>
              </div>
            )}
            {s.players?.sample && s.players.sample.length > 0 && (
              <div className="pt-3 border-t border-white/10">
                <dt className="text-white/50 mb-2">Сейчас играют</dt>
                <dd className="flex flex-wrap gap-2">
                  {s.players.sample.map((p) => (
                    <span key={p.name} className="bg-ink px-2 py-0.5 rounded text-xs font-mono">
                      {p.name}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </>
        ) : (
          <p className="text-white/50">
            Сервер недоступен. {s.error ? <span className="text-xs">({s.error})</span> : null}
          </p>
        )}
      </dl>
    </div>
  );
}
