// .NET 9, единый веб-хост: MCP (WebSocket) + HTTP Admin API.
// MCP транспорт и хендлеры подключаются через официальный C# MCP SDK.

using Aura.Domain;
using Aura.Infrastructure;
using Aura.Domain.Interfaces;
using ModelContextProtocol.Protocol;
using ModelContextProtocol;

var builder = WebApplication.CreateBuilder(args);

// --- Конфигурация окружения ---
var mongoConn = Environment.GetEnvironmentVariable("AURA_MONGO_CONN") ?? "mongodb://localhost:27017";
var mongoDb   = Environment.GetEnvironmentVariable("AURA_MONGO_DB")   ?? "aura";

// --- DI ---
builder.Services.AddSingleton(new MongoStore(mongoConn, mongoDb));
builder.Services.AddSingleton<IArtifactRepository, ArtifactMongoClient>();
builder.Services.AddSingleton<IArtifactVersionRepository, ArtifactVersionMongoClient>();
builder.Services.AddSingleton<IAdminRepository, AdminMongoClient>();
builder.Services.AddSingleton<ArtifactService>();

// === MCP SDK ===
// Регистрация сервера MCP + обработчики Prompts/Resources через официальный SDK.
builder.Services
    .AddMcpServer(options =>
    {
        options.ServerInfo = new Implementation
        {
            Name = "aura",
            Version = "0.1.0"
        };
    })
    .WithHttpTransport()
    .WithListPromptsHandler(async (ctx, ct) =>
    {
        var svc = ctx.Services!.GetRequiredService<ArtifactService>();
        var list = await svc.ListAsync(ArtifactType.Prompt, null, ct);
        return new ListPromptsResult
        {
            Prompts = list.Select(a => new Prompt
            {
                Name = a.Key,
                Title = a.Title,
            }).ToList()
        };
    })
    .WithGetPromptHandler(async (ctx, ct) =>
    {
        var svc = ctx.Services!.GetRequiredService<ArtifactService>();
        var data = await svc.GetActiveAsync(ArtifactType.Prompt, ctx.Params!.Name, ct)
                   ?? throw new McpException("ARTIFACT_NOT_FOUND");

        return new GetPromptResult
        {
            Description = data.title,
            Messages =
            {
                new PromptMessage
                {
                    Role = Role.User,
                    Content = new TextContentBlock { Text = data.body ?? string.Empty }
                }
            }
        };
    })
    .WithListResourcesHandler(async (ctx, ct) =>
    {
        var svc = ctx.Services!.GetRequiredService<ArtifactService>();
        var list = await svc.ListAsync(ArtifactType.Resource, null, ct);
        return new ListResourcesResult
        {
            Resources = list.Select(a => new Resource
            {
                Name = a.Key,
                Title = a.Title,
                Uri = $"aura://resource/{a.Key}",
                MimeType = "text/plain"
            }).ToList()
        };
    })
    .WithReadResourceHandler(async (ctx, ct) =>
    {
        var svc = ctx.Services!.GetRequiredService<ArtifactService>();
        var uri = ctx.Params!.Uri;
        var prefix = "aura://resource/";
        var key = uri.StartsWith(prefix, StringComparison.OrdinalIgnoreCase) ? uri[prefix.Length..] : uri;
        var data = await svc.GetActiveAsync(ArtifactType.Resource, key, ct)
                   ?? throw new McpException("ARTIFACT_NOT_FOUND");

        return new ReadResourceResult
        {
            Contents =
            {
                new TextResourceContents { Text = data.template ?? string.Empty }
            }
        };
    });


var app = builder.Build();

app.MapMcp("/mcp");

app.MapAdminApi(); 

app.Run();