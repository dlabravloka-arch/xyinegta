# Деплой через playit.gg (без VPS, без карты)

Если у тебя нет VPS и не получается с Oracle — запусти всё на своём ПК и опубликуй через **playit.gg**: бесплатный туннель, который даёт публичный адрес для домашнего сервера. Карта не нужна.

## Ограничения этого варианта

- ⚠ Сервер работает пока твой ПК включён.
- ⚠ Скорость и пинг зависят от твоего интернета.
- ⚠ Бесплатный playit-адрес выглядит как `random-name.joinmc.link` — кастомный домен только в платной версии.
- ⚠ HTTPS для сайта через playit будет неудобно — проще пускать сайт через бесплатный туннель Cloudflare (см. ниже).

Для постоянного «настоящего» сервера лучше всё же Oracle (см. [DEPLOY-ORACLE.md](DEPLOY-ORACLE.md)).

## 1. Установка Docker

- **Windows / Mac:** https://www.docker.com/products/docker-desktop/
- **Linux:** `curl -fsSL https://get.docker.com | sh`

## 2. Запуск сервера + сайта локально

```bash
git clone <url-этого-репо> mcp
cd mcp

cp .env.example .env
# Минимум: AUTH_SECRET=$(openssl rand -base64 48)
# DOMAIN можно временно оставить mc.example.com — playit потом даст реальный.

cp server/server.properties.example server/server.properties

docker compose up -d --build minecraft website
# Caddy не запускаем — он не нужен пока нет домена с HTTPS.
```

Проверь локально:
- Сайт: http://localhost:3000
- MC: подключись к `localhost` в Minecraft Java.

## 3. Регистрация и установка playit.gg

1. https://playit.gg → **Sign up** (через Discord/Google, без карты).
2. Скачай агент: https://playit.gg/download — выбери свою ОС.
3. Запусти. В консоли он покажет ссылку для авторизации, открой и подтверди.

## 4. Создание туннеля для Minecraft

1. На https://playit.gg/account/tunnels → **Create Tunnel**.
2. Тип: **Minecraft Java** (стандартный шаблон, порт 25565).
3. Local target: `127.0.0.1:25565`.
4. Сохрани. playit выдаст адрес типа `cute-name.joinmc.link`.

## 5. Создание туннеля для сайта (опционально)

Можно через тот же playit (TCP), но удобнее **Cloudflare Tunnel** — даёт настоящий HTTPS-домен бесплатно.

```bash
# Установка cloudflared (Ubuntu)
sudo apt install -y cloudflared
# Авторизация
cloudflared tunnel login
# Создание туннеля
cloudflared tunnel create mcp-site
# Привяжи к домену (нужен домен в Cloudflare, можно бесплатный .tk/.ml через Freenom — или платный)
cloudflared tunnel route dns mcp-site mc.твойдомен.com
# Запуск
cloudflared tunnel --url http://localhost:3000 run mcp-site
```

## 6. Финал

Обнови `.env`:

```
PUBLIC_SERVER_ADDRESS=cute-name.joinmc.link
PUBLIC_SITE_URL=https://mc.твойдомен.com
MC_HOST=cute-name.joinmc.link  # либо оставь "minecraft" если опрашиваем по докер-сети
```

```bash
docker compose up -d --build website
```

Готово: игроки заходят на `cute-name.joinmc.link` в Minecraft, сайт открывается на твоём Cloudflare-домене.

## Как сделать playit-адрес и сайт «одним адресом»

playit.gg в платном плане ($3/мес) позволяет привязать свой домен к туннелю. Тогда:
- DNS: `mc.твойдомен.com` → CNAME → playit-туннель
- Сайт: на тот же домен через Cloudflare Tunnel

Игрок вставляет `mc.твойдомен.com` в Minecraft → попадает на сервер. Открывает в браузере → попадает на сайт. Один адрес — всё работает.
