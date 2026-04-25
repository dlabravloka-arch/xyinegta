# Деплой на Oracle Cloud Free Tier

Лучший бесплатный вариант: **4 ARM-ядра + 24 GB RAM, навсегда бесплатно, публичный IP**. Этого хватит на 30+ онлайн игроков.

## 1. Регистрация в Oracle Cloud

1. Открой https://www.oracle.com/cloud/free/ → **Start for free**.
2. Заполни форму. **Понадобится карта** для верификации (списания не будет, можно виртуальную).
3. Выбери home region поближе (Frankfurt / Amsterdam / London для России и СНГ обычно работают лучше).

## 2. Создание VM

1. В консоли Oracle Cloud: **Compute → Instances → Create instance**.
2. Настройки:
   - **Image:** Canonical Ubuntu 22.04
   - **Shape:** `VM.Standard.A1.Flex` (ARM Ampere) → **4 OCPU, 24 GB RAM** (это в free-tier лимит, ничего не стоит)
   - **Networking:** оставь дефолт (новый VCN), **поставь галочку «Assign a public IPv4 address»**
   - **SSH keys:** загрузи свой публичный ключ (или сгенерируй новую пару прямо в форме)
3. Жми **Create**. Ждёшь ~1 минуту.

> 💡 Если на A1.Flex выдаёт «Out of capacity» — попробуй другой регион или повтори через час. У Oracle ARM-инстансы периодически дефицитные.

## 3. Открытие портов

По умолчанию открыт только SSH (22). Надо открыть 80, 443 и 25565.

### 3.1 На уровне облака (Security List)

1. В консоли: **Networking → Virtual Cloud Networks → твой VCN → Security Lists → Default Security List**.
2. **Add Ingress Rules** (повтори для каждого порта):

| Source CIDR | IP Protocol | Destination Port |
|---|---|---|
| `0.0.0.0/0` | TCP | 80 |
| `0.0.0.0/0` | TCP | 443 |
| `0.0.0.0/0` | TCP | 25565 |

### 3.2 На уровне ОС (iptables в Ubuntu)

```bash
ssh ubuntu@ТВОЙ_IP

sudo iptables -I INPUT 1 -p tcp --dport 80    -j ACCEPT
sudo iptables -I INPUT 1 -p tcp --dport 443   -j ACCEPT
sudo iptables -I INPUT 1 -p tcp --dport 25565 -j ACCEPT
sudo netfilter-persistent save
```

## 4. Установка Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
exit  # перелогинься чтобы группа применилась
ssh ubuntu@ТВОЙ_IP
docker --version
```

## 5. Развёртывание

```bash
git clone <url-этого-репо> mcp
cd mcp

cp .env.example .env
nano .env
# Заполни:
#   DOMAIN=твоёимя.duckdns.org   (см. docs/DOMAIN-DUCKDNS.md)
#   AUTH_SECRET=$(openssl rand -base64 48)
#   PUBLIC_SERVER_ADDRESS=твоёимя.duckdns.org

cp server/server.properties.example server/server.properties

docker compose up -d --build
docker compose logs -f
```

Через 2-5 минут (генерация мира + получение HTTPS-сертификата):

- Сайт: `https://твоёимя.duckdns.org`
- Minecraft: вставляй `твоёимя.duckdns.org` в Multiplayer → Add Server.

## 6. Поддерживай актуальный IP (если меняется)

Oracle обычно даёт **постоянный IP** через Reserved Public IP (бесплатно):
**Networking → IP Management → Reserved Public IPs → Reserve Public IP Address**, затем привязать к VNIC инстанса.

## 7. Мониторинг и бэкап

```bash
# Использование ресурсов
docker stats

# Бэкап мира раз в сутки (cron)
crontab -e
# добавь:
0 4 * * * cd /home/ubuntu/mcp && docker run --rm -v mcp_mc_world:/from -v $(pwd)/backups:/to alpine tar czf /to/world-$(date +\%Y\%m\%d).tar.gz -C /from . && find $(pwd)/backups -mtime +7 -delete
```

## Если Oracle не подходит

Альтернативы (платно, но дёшево):
- **Hetzner Cloud** — CX22 (€4.5/мес, 2 ядра, 4 GB RAM) — хватит на 5-10 игроков.
- **Contabo** — VPS S (€4.5/мес, 4 ядра, 8 GB RAM).
- **Aeza, FirstVDS, Beget** — российские, оплата картой РФ.

Установка на них идентична — шаги 4-5 этого гайда.
