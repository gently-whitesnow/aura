using Aura.Domain;
using Aura.Infrastructure;
using Aura.Domain.Interfaces;
using ModelContextProtocol.Protocol;
using ModelContextProtocol;
using Aura.Server;
using Aura.Domain.Models;

var builder = WebApplication.CreateBuilder(args);

// Конфигурация окружения
var mongoConn = Environment.GetEnvironmentVariable("AURA_MONGO_CONN") ?? "mongodb://localhost:27017";
var mongoDb   = Environment.GetEnvironmentVariable("AURA_MONGO_DB")   ?? "aura";

// DI
builder.Services.AddSingleton(new MongoCollectionsProvider(mongoConn, mongoDb));
builder.Services.AddSingleton<IArtifactRepository, ArtifactMongoClient>();
builder.Services.AddSingleton<IArtifactVersionRepository, ArtifactVersionMongoClient>();
builder.Services.AddSingleton<IAdminRepository, AdminMongoClient>();
builder.Services.AddSingleton<ArtifactService>();

// MCP SDK
builder.AddAuraMcpServer();

var app = builder.Build();

app.MapMcp("/mcp");

app.MapUiApi(); 

app.Run();