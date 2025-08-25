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
using System.Text.Json;
using Serilog;
using OpenTelemetry.Metrics;
using OpenMcp.Server.Logging;

public class Program
{
    public static async Task Main(string[] args)
    {
        Log.Logger = BootstrapLogger.Create();

        try
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Configuration
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
                .AddEnvironmentVariables()
                .AddCommandLine(args);

            var externalPath = Path.Combine(AppContext.BaseDirectory, "external_settings.json");
            if (File.Exists(externalPath))
            {
                builder.Configuration.AddJsonFile(externalPath, optional: false, reloadOnChange: true);
            }
            else
            {
                Console.WriteLine("File external_settings.json not found");
            }

            // Конфигурация окружения
            var mongoConn = Environment.GetEnvironmentVariable("MONGO_CONNECTION") ?? "mongodb://localhost:27017";
            var mongoDb = Environment.GetEnvironmentVariable("MONGO_DATABASE") ?? "open_mcp";
            var loginHeader = Environment.GetEnvironmentVariable("LOGIN_HEADER");

            // DI
            builder.Services.AddSingleton(new MongoCollectionsProvider(mongoConn, mongoDb));

            var adminsSettings = builder.Configuration.GetSection("AdminsSettings:Enabled").Get<bool>();
            if (adminsSettings)
                builder.Services.AddSingleton<IAdminRepository, AdminMongoClient>();
            else
                builder.Services.AddSingleton<IAdminRepository, DefaultAdminRepository>();

            builder.Services.AddSingleton<PromptsService>();
            builder.Services.AddSingleton<ResourcesService>();
            builder.Services.AddSingleton<ResourcesMongoClient>();
            builder.Services.AddSingleton<IPrimitivesRepository<ResourceRecord>, ResourcesMongoClient>(sp => sp.GetRequiredService<ResourcesMongoClient>());
            builder.Services.AddSingleton<IResourcesMongoClient, ResourcesMongoClient>(sp => sp.GetRequiredService<ResourcesMongoClient>());
            builder.Services.AddSingleton<IPrimitivesRepository<PromptRecord>, PromptsMongoClient>();
            builder.Services.AddSingleton<IResourceChangeNotifier, ResourceSubscriptionManager>();
            builder.Services.AddSingleton<IResourceSubscriptionManager, ResourceSubscriptionManager>();

            // add configuration
            builder.Services.AddSerilog((ctx, lc) => lc.ReadFrom.Configuration(builder.Configuration));
            builder.Services.AddHealthChecks();

            builder.Services.AddOpenTelemetry()
                .WithMetrics(metrics => metrics
                .AddRuntimeInstrumentation()
                .AddAspNetCoreInstrumentation()
                .AddHttpClientInstrumentation()
                .AddPrometheusExporter());

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("CorsPolicy", policy =>
                {
                    policy.SetIsOriginAllowed(_ => true)
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials();
                });
            });

            // MCP SDK
            builder.AddOpenMcpServer();

            var app = builder.Build();

            app.MapMcp("/mcp");

            app.MapPromptsApi();
            app.MapAdminApi();
            app.MapResourcesApi();
            app.MapUsersApi();

            // use configuration

            app.UseSerilogRequestLogging();
            app.MapHealthChecks("/_internal/ping");
            app.UseOpenTelemetryPrometheusScrapingEndpoint();
            app.UseCors("CorsPolicy");

            // Раздача статики и SPA-фолбэк (включается только если указан UI_API_URL)
            var uiApiUrl = Environment.GetEnvironmentVariable("UI_API_URL");
            if (!string.IsNullOrEmpty(uiApiUrl))
            {
                app.UseDefaultFiles();
                app.UseStaticFiles();

                // Рантайм-конфиг фронтенда: env.js
                app.MapGet("/env.js", (HttpContext ctx) =>
                {
                    var apiUrl = Environment.GetEnvironmentVariable("UI_API_URL") ?? string.Empty;
                    ctx.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0";
                    var payload = "window.env=" + JsonSerializer.Serialize(new { API_URL = apiUrl }) + ";";
                    return Results.Text(payload, "application/javascript");
                });

                // SPA fallback для маршрутов фронтенда
                app.MapFallback(() =>
                {
                    var webRoot = app.Environment.WebRootPath ?? "wwwroot";
                    var indexPath = Path.Combine(webRoot, "index.html");
                    if (File.Exists(indexPath))
                        return Results.File(indexPath, "text/html");
                    return Results.NotFound();
                });
            }

            app.Run();

        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "Fatal host error");
        }
        finally
        {
            await Log.CloseAndFlushAsync();
        }
    }
}