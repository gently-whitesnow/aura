using OpenMcp.Infrastructure;
using OpenMcp.Server;
using OpenMcp.Domain.Prompts;
using OpenMcp.Domain.Resources;
using OpenMcp.Server.Api;
using OpenMcp.Infrastructure.Prompts;
using OpenMcp.Infrastructure.Admins;
using OpenMcp.Infrastructure.Mongo;
using OpenMcp.Domain.Primitives;
using OpenMcp.Domain.Prompts.Models;
using OpenMcp.Domain.Resources.Models;
using OpenMcp.Infrastructure.Resources;
using OpenMcp.Domain.Admins;

var builder = WebApplication.CreateBuilder(args);

// Конфигурация окружения
var mongoConn = Environment.GetEnvironmentVariable("MONGO_CONNECTION") ?? "mongodb://localhost:27017";
var mongoDb   = Environment.GetEnvironmentVariable("MONGO_DATABASE")   ?? "open_mcp";
var loginHeader = Environment.GetEnvironmentVariable("LOGIN_HEADER");

// DI
builder.Services.AddSingleton(new MongoCollectionsProvider(mongoConn, mongoDb));

if (loginHeader is not null)
    builder.Services.AddSingleton<IAdminRepository, AdminMongoClient>();
else
    builder.Services.AddSingleton<IAdminRepository, DefaultAdminRepository>();

builder.Services.AddSingleton<PromptsService>();
builder.Services.AddSingleton<ResourcesService>();
builder.Services.AddSingleton<IPrimitivesRepository<PromptRecord>, PromptsMongoClient>();
builder.Services.AddSingleton<IPrimitivesRepository<ResourceRecord>, ResourcesMongoClient>();
builder.Services.AddSingleton<IResourceChangeNotifier, ResourceSubscriptionManager>();
builder.Services.AddSingleton<IResourceSubscriptionManager, ResourceSubscriptionManager>();

// MCP SDK
builder.AddOpenMcpServer();

var app = builder.Build();

app.MapMcp("/mcp");

app.MapPromptsApi();
app.MapAdminApi();
app.MapResourcesApi();
app.MapUsersApi();

app.Run();