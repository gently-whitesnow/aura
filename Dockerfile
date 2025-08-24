ARG SDK_TAG=9.0-bookworm-slim
ARG RUNTIME_TAG=9.0-noble-chiseled-composite-extra

# Сборка фронтенда
FROM node:20 AS ui-build
WORKDIR /webui
COPY webui/ .
RUN npm ci && npm run build

# Сборка бэкенда
FROM mcr.microsoft.com/dotnet/sdk:${SDK_TAG} AS build
WORKDIR /src

# Копируем всю структуру проекта
COPY . .

RUN dotnet restore OpenMcp.sln

RUN dotnet publish src/OpenMcp.Server/OpenMcp.Server.csproj \
     -c Release \
     --self-contained=false \
     -p:PublishSingleFile=false \
     -o /app/publish

# Копируем собранный фронтенд в wwwroot (папка dist может быть пустой)
RUN mkdir -p /app/publish/wwwroot
COPY --from=ui-build /webui/dist/ /app/publish/wwwroot/

FROM mcr.microsoft.com/dotnet/aspnet:${RUNTIME_TAG} AS runtime
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENTRYPOINT ["dotnet", "OpenMcp.Server.dll"]