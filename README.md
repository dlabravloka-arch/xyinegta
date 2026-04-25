# Minecraft Server Platform

Готовый комплект «под ключ»: **Fabric 1.21 сервер с модами оптимизации + сайт с регистрацией и донатом** на одном домене. Адрес сайта = адрес сервера в Minecraft Java.

```
https://mc.example.com   →  сайт (Next.js)
mc.example.com:25565     →  Minecraft Java сервер (Fabric)
```

## Что внутри

- **`server/`** — Fabric 1.21.1 сервер, скрипт автозагрузки модов с Modrinth, оптимальные JVM-флаги (Aikar's flags).
- **`website/`** — Next.js сайт: статус сервера в реальном времени, регистрация, личный кабинет, страница модов, правил, донаты.
- **`deploy/`** — Caddy reverse-proxy с автоматическим HTTPS (Let's Encrypt).
- **`docker-compose.yml`** — поднимает всё одной командой.
- **`docs/`** — пошаговые гайды по бесплатному деплою.

## Моды на сервере

Все моды **server-side совместимы** — ванильный клиент Minecraft подключается без установки модов.

**⚡ Оптимизация:** Lithium · FerriteCore · Krypton · C2ME · ScalableLux · ServerCore · Noisium · Spark

**🎲 Геймплей:** Carpet · FallingTree (одной киркой целое дерево) · Easy Anvils · Trade Cycling · Wandering Trades · AppleSkin

Полный список и описание — в [`server/mods.txt`](server/mods.txt) и на странице сайта `/mods`.

---

## Быстрый старт (когда у тебя уже есть VPS и домен)

```bash
# 1. Клонируй
git clone <this-repo> minecraft-server-platform
cd minecraft-server-platform

# 2. Конфиг
cp .env.example .env
nano .env  # минимум: DOMAIN, AUTH_SECRET (openssl rand -base64 48)

cp server/server.properties.example server/server.properties

# 3. Запусти
docker compose up -d --build

# 4. Открой https://${DOMAIN} и подключайся в Minecraft по адресу ${DOMAIN}
```

Первый запуск качает Java/Fabric/моды и генерирует мир — это 2-5 минут. Логи: `docker compose logs -f`.

---

## Нет VPS? — Бесплатные варианты

Этот проект может крутиться **полностью бесплатно**. Выбери один из вариантов:

### Вариант A — Oracle Cloud Free Tier (рекомендую)
**Что получаешь:** 4 ARM-ядра + 24 GB RAM + публичный IP **навсегда бесплатно**. Полноценный VPS, который тянет MC + сайт + ещё что захочешь.

📖 [docs/DEPLOY-ORACLE.md](docs/DEPLOY-ORACLE.md) — пошагово: регистрация, создание VM, открытие портов, развёртывание.

### Вариант B — playit.gg (если карты для Oracle нет)
**Что получаешь:** туннель из домашнего ПК в интернет. Сервер запускается у тебя, playit.gg даёт публичный адрес типа `your-server.joinmc.link`. Бесплатно, без карты.

📖 [docs/DEPLOY-PLAYIT.md](docs/DEPLOY-PLAYIT.md) — пошагово: установка туннеля, настройка адреса, ограничения.

### Домен — DuckDNS (бесплатно)
Не хочешь покупать домен? Возьми бесплатный поддомен `твоёимя.duckdns.org`. Поддерживает A/AAAA, динамическое обновление IP. Идеально для домашнего сервера.

📖 [docs/DOMAIN-DUCKDNS.md](docs/DOMAIN-DUCKDNS.md) — настройка домена + SRV-запись (чтобы порт `:25565` не пришлось писать вручную).

---

## Архитектура

```
                        Internet
                            │
                    ┌───────┴───────┐
                    ▼               ▼
                  :443             :25565
                  :80
                    │               │
              ┌─────▼────┐   ┌──────▼──────┐
              │  Caddy   │   │  Minecraft  │
              │  (HTTPS) │   │  (Fabric)   │
              └─────┬────┘   └──────┬──────┘
                    │               │
              ┌─────▼────┐          │
              │ Next.js  │──────────┘
              │ + Prisma │  опрос статуса
              │  SQLite  │
              └──────────┘
```

- Caddy слушает 80/443, автоматически получает Let's Encrypt сертификат для `${DOMAIN}`.
- Next.js рендерит страницы и опрашивает MC-сервер по протоколу serverlist-ping (порт 25565).
- Prisma + SQLite хранит пользователей и донаты в одном файле — не надо отдельную БД.

## Конфигурация (`.env`)

| Переменная | Описание |
|---|---|
| `DOMAIN` | Твой домен (например `mc.duckdns.org`). Caddy получит на него HTTPS. |
| `AUTH_SECRET` | Секрет для подписи JWT-сессий. Сгенерируй: `openssl rand -base64 48`. |
| `PUBLIC_SERVER_NAME` | Название сервера, отображается на сайте. |
| `PUBLIC_SERVER_ADDRESS` | Адрес сервера, который видит игрок (тот что в Minecraft вставлять). |
| `MC_VERSION` | Версия MC. По умолчанию `1.21.1`. |
| `MC_MEM` | Память для JVM, например `4G`, `6G`. |
| `STRIPE_SECRET_KEY` + `STRIPE_PRICE_ID_*` | Если пусто — донаты показывают заглушку. Иначе — настоящий Stripe Checkout. |

## Полезные команды

```bash
# Логи только сервера
docker compose logs -f minecraft

# Зайти в консоль сервера (можно писать команды: /op, /save-all, /stop)
docker attach mcp-minecraft  # выйти: Ctrl+P, Ctrl+Q  (НЕ Ctrl+C — это остановит сервер!)

# Перезапустить только сайт (например после правки кода)
docker compose up -d --build website

# Бэкап мира
docker run --rm -v mcp_mc_world:/from -v $(pwd):/to alpine tar czf /to/world-backup.tar.gz -C /from .

# Дать игроку оператора (после первого захода)
docker attach mcp-minecraft
> op YourMinecraftNick
```

## Сделать админом на сайте

```bash
docker compose exec website sh -lc "node -e \"
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.user.update({ where: { username: 'твой_логин' }, data: { role: 'admin' } }).then(() => process.exit(0));
\""
```

## Безопасность

- `AUTH_SECRET` — обязательно сильный, не коммить `.env`.
- `online-mode=true` в server.properties — пускает только лицензионных игроков.
- Caddy проставляет HSTS + X-Frame-Options + nosniff.
- Пароли хешируются bcrypt (cost 10).
- SQLite-файл лежит в Docker volume `website_data` — добавь в бэкап.

## Лицензия и оговорка

MIT. Этот проект — независимая разработка, не аффилирован с Mojang/Microsoft. Minecraft, Fabric и все упомянутые моды принадлежат их авторам.
