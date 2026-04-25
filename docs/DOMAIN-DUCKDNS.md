# Бесплатный домен через DuckDNS + SRV-запись

DuckDNS даёт бесплатный поддомен вида `твоёимя.duckdns.org` который указывает на твой IP. Поддерживает A-записи, динамическое обновление, и (через интеграцию с DNS-провайдерами) SRV.

## 1. Регистрация

1. Открой https://www.duckdns.org → войди через Google/GitHub/Twitter.
2. В поле **sub domain** введи желаемое имя (например `myserver`) → **add domain**.
3. Скопируй свой `token` (на той же странице сверху) — пригодится для авто-обновления IP.

## 2. Привязка IP

В таблице с твоим поддоменом:
- **current ip**: вставь публичный IP твоего сервера → **update ip**.

Готово: `myserver.duckdns.org` теперь резолвится в твой IP.

## 3. Авто-обновление IP (если IP может меняться)

На VPS:
```bash
# Cron: обновлять IP каждые 5 минут
crontab -e
# Добавь:
*/5 * * * * curl -s "https://www.duckdns.org/update?domains=myserver&token=ТВОЙ_ТОКЕН&ip=" >/dev/null 2>&1
```

(Если IP статический — этот шаг не нужен.)

## 4. SRV-запись (чтобы не писать `:25565`)

По умолчанию Minecraft Java использует порт 25565. Если он у тебя такой — игроки могут просто вводить `myserver.duckdns.org`. Если порт другой (например ты на playit.gg или сделал свой), нужна SRV-запись `_minecraft._tcp`:

```
_minecraft._tcp.myserver.duckdns.org.   IN SRV   0 5 25565 myserver.duckdns.org.
```

⚠ DuckDNS бесплатно SRV-записи **не поддерживает напрямую** через UI. Решения:

### Вариант А — оставь порт 25565 и SRV не нужна

Самый простой. Открой 25565 на VPS (см. DEPLOY-ORACLE.md шаг 3). Игроки вводят просто `myserver.duckdns.org`.

### Вариант Б — переедь на Cloudflare DNS (тоже бесплатно, поддерживает SRV)

1. Купи дешёвый домен (~$1-3/год: .xyz, .online на Namecheap / Porkbun).
2. Подключи к Cloudflare (https://dash.cloudflare.com → Add Site).
3. В Cloudflare DNS добавь:
   - A `mc` → твой IP
   - SRV `_minecraft._tcp` → `mc.твойдомен.com` порт `XXXXX`

Готово, игроки вводят `mc.твойдомен.com` — Minecraft сам найдёт правильный порт.

### Вариант В — playit.gg

Если ты на playit.gg — он сам делает SRV для своих адресов. Игроки вводят `имя.joinmc.link` без порта.

## 5. Использование с этим проектом

В `.env` укажи свой домен:

```
DOMAIN=myserver.duckdns.org
PUBLIC_SERVER_ADDRESS=myserver.duckdns.org
PUBLIC_SITE_URL=https://myserver.duckdns.org
```

Caddy при первом запуске автоматически получит Let's Encrypt-сертификат для `myserver.duckdns.org` (если порты 80/443 открыты и домен резолвится).

## Дополнительно: Cloudflare для DDoS-защиты

Если используешь свой домен через Cloudflare, **выключи проксирование (оранжевое облачко → серое)** для записей которые ведут на MC-сервер — Cloudflare не проксирует Minecraft-протокол на бесплатном плане. Для веб-сайта оранжевое облачко наоборот включай — будет CDN и защита.
