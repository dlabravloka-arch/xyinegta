#!/usr/bin/env bash
# Установка Fabric 1.21.x сервера + загрузка модов с Modrinth.
# Использование: ./setup.sh [<MC_VERSION>]
# По умолчанию: 1.21.1 (стабильная версия с самой широкой поддержкой модов).

set -euo pipefail

MC_VERSION="${1:-1.21.1}"
LOADER="fabric"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODS_DIR="${SCRIPT_DIR}/mods"
MODS_LIST="${SCRIPT_DIR}/mods.txt"

echo "==> Установка Minecraft Fabric server ${MC_VERSION}"

# Проверка зависимостей
for cmd in curl jq java; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "ОШИБКА: команда '$cmd' не найдена. Установи её и повтори."
        exit 1
    fi
done

# Java версия
JAVA_VER="$(java -version 2>&1 | awk -F\" '/version/ {print $2}' | awk -F. '{print $1}')"
if [ "${JAVA_VER:-0}" -lt 21 ]; then
    echo "ВНИМАНИЕ: Minecraft 1.21+ требует Java 21+. У тебя Java ${JAVA_VER}."
    echo "Установи: sudo apt install -y openjdk-21-jre-headless"
    exit 1
fi

cd "$SCRIPT_DIR"

# 1. Скачиваем Fabric installer и серверный jar
echo "==> Получаем актуальные версии Fabric"
FABRIC_INSTALLER_VER="$(curl -s https://meta.fabricmc.net/v2/versions/installer | jq -r '.[0].version')"
FABRIC_LOADER_VER="$(curl -s "https://meta.fabricmc.net/v2/versions/loader/${MC_VERSION}" | jq -r '.[0].loader.version')"

echo "    fabric-installer: ${FABRIC_INSTALLER_VER}"
echo "    fabric-loader:    ${FABRIC_LOADER_VER}"

SERVER_JAR_URL="https://meta.fabricmc.net/v2/versions/loader/${MC_VERSION}/${FABRIC_LOADER_VER}/${FABRIC_INSTALLER_VER}/server/jar"
echo "==> Скачиваем серверный jar"
curl -L -o fabric-server-launch.jar "$SERVER_JAR_URL"

# 2. EULA
echo "==> Принимаем EULA (запуская сервер ты соглашаешься с https://aka.ms/MinecraftEULA)"
echo "eula=true" > eula.txt

# 3. server.properties (если ещё нет)
if [ ! -f server.properties ]; then
    cp server.properties.example server.properties
fi

# 4. Загрузка модов с Modrinth
mkdir -p "$MODS_DIR"
rm -f "$MODS_DIR"/*.jar

echo "==> Скачиваем моды для Minecraft ${MC_VERSION} (loader=${LOADER})"

while IFS= read -r line || [ -n "$line" ]; do
    # пропуск пустых и комментариев
    line="${line%%#*}"
    line="$(echo "$line" | xargs)"
    [ -z "$line" ] && continue

    slug="$(echo "$line" | awk '{print $1}')"

    api_url="https://api.modrinth.com/v2/project/${slug}/version?game_versions=%5B%22${MC_VERSION}%22%5D&loaders=%5B%22${LOADER}%22%5D"
    json="$(curl -s "$api_url")"
    file_url="$(echo "$json" | jq -r '.[0].files[]? | select(.primary==true) | .url' | head -n1)"

    if [ -z "$file_url" ] || [ "$file_url" = "null" ]; then
        # fallback: первый файл первой версии
        file_url="$(echo "$json" | jq -r '.[0].files[0]?.url // empty')"
    fi

    if [ -z "$file_url" ]; then
        echo "    [SKIP] ${slug} — нет совместимой версии для ${MC_VERSION}/${LOADER}"
        continue
    fi

    fname="$(basename "$file_url")"
    echo "    [OK]   ${slug} → ${fname}"
    curl -sL -o "${MODS_DIR}/${fname}" "$file_url"
done < "$MODS_LIST"

echo ""
echo "==> Готово! Запусти сервер: ./start.sh"
echo "    Первый запуск создаст мир — это может занять 1-3 минуты."
