using OpenMcp.Infrastructure;
using OpenMcp.Domain.Interfaces;
using OpenMcp.Server;
using OpenMcp.Domain.Prompts;
using OpenMcp.Domain.Resources;
using OpenMcp.Server.Api;
using OpenMcp.Infrastructure.MongoClients;

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

builder.Services.AddSingleton<IPromptRepository, PromptMongoClient>();
builder.Services.AddSingleton<PromptsService>();
builder.Services.AddSingleton<IResourceRepository, ResourceMongoClient>();
builder.Services.AddSingleton<IResourceChangeNotifier, ResourceSubscriptionManager>();
builder.Services.AddSingleton<IResourceSubscriptionManager, ResourceSubscriptionManager>();
builder.Services.AddSingleton<ResourcesService>();

// MCP SDK
builder.AddOpenMcpServer();

var app = builder.Build();

app.MapMcp("/mcp");

app.MapPromptsApi();
app.MapAdminApi();
app.MapResourcesApi();
app.MapUsersApi();

app.Run();