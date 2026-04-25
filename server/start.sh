#!/usr/bin/env bash
# Запуск Fabric сервера. Память по умолчанию: 4G (поменяй MEM при желании).
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

MEM="${MEM:-4G}"

# Aikar's flags — оптимальные настройки G1GC для Minecraft серверов
# https://docs.papermc.io/paper/aikars-flags
JVM_FLAGS=(
    -Xms"${MEM}" -Xmx"${MEM}"
    -XX:+UseG1GC
    -XX:+ParallelRefProcEnabled
    -XX:MaxGCPauseMillis=200
    -XX:+UnlockExperimentalVMOptions
    -XX:+DisableExplicitGC
    -XX:+AlwaysPreTouch
    -XX:G1NewSizePercent=30
    -XX:G1MaxNewSizePercent=40
    -XX:G1HeapRegionSize=8M
    -XX:G1ReservePercent=20
    -XX:G1HeapWastePercent=5
    -XX:G1MixedGCCountTarget=4
    -XX:InitiatingHeapOccupancyPercent=15
    -XX:G1MixedGCLiveThresholdPercent=90
    -XX:G1RSetUpdatingPauseTimePercent=5
    -XX:SurvivorRatio=32
    -XX:+PerfDisableSharedMem
    -XX:MaxTenuringThreshold=1
    -Dusing.aikars.flags=https://mcflags.emc.gs
    -Daikars.new.flags=true
)

exec java "${JVM_FLAGS[@]}" -jar fabric-server-launch.jar nogui
