# open-mcp

Open Source сервис для централизованного хранения [MCP примитивов](https://modelcontextprotocol.io/docs/learn/architecture#primitives).

## 🚀 Запуск

```bash
docker compose up
```

После старта сервис будет доступен на [http://localhost:8080](http://localhost:8080).

## ✨ Особенности
- Если не указать `LOGIN_HEADER`, все пользователи автоматически получают права админа.  
- MCP-клиенты не видят примитивы до тех пор, пока админ их не заапрувит.  

## 🔧 Возможности
- Создание текстовых ресурсов  
- Создание текстовых промптов  
- Связь промптов с ресурсами  

## 📌 В планах
- Добавление админов без ручной записи в базу  
- Отображение на главной странице примитивов, ожидающих апрува  
- Поле **Description** в UI и бизнес-логике (возможно это будет полезно для mcp клиентов)  
- Поддержка других MIME-типов при необходимости  
- Поддержка аннотаций в ресурсах  
- Метрики вызовов API и MCP  

## 💻 Разработка
- [mcp-inspector](https://github.com/modelcontextprotocol/inspector) — проверка работы MCP со стороны клиентов  
- Бэкенд: требуется локальная MongoDB  
  ```bash
  docker compose --profile db up
  ```  
- Фронтенд: запуск вместе с бэкендом и MongoDB  
  ```bash
  docker compose --profile backend up
  ```

## 🔍 Аналогичные сервисы
- [Latitude](https://docs.latitude.so/guides/getting-started/introduction) — ориентирован на промпт-инжиниринг (узко и сложно для кейсов с ресурсами).  
- [Langfuse](https://langfuse.com/) — тоже больше про промпт-инжиниринг, другая бизнес-модель.  
- [Plagged.in](https://plagged.in/) — агрегатор MCP, а не полноценное хранилище.  
