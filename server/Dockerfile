FROM eclipse-temurin:21-jre-jammy

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl jq ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /server

COPY mods.txt setup.sh start.sh server.properties.example ./
RUN chmod +x setup.sh start.sh

# Build-arg позволяет менять версию через docker-compose
ARG MC_VERSION=1.21.1
ENV MC_VERSION=${MC_VERSION}

# Скачиваем сервер и моды на этапе сборки образа
RUN ./setup.sh "${MC_VERSION}"

EXPOSE 25565

# Том для мира и логов
VOLUME ["/server/world", "/server/world_nether", "/server/world_the_end", "/server/logs"]

ENV MEM=4G
CMD ["./start.sh"]
