using Aura.Domain;
using Aura.Domain.Models;

namespace Aura.Server
{
    /// <summary>
    /// Web UI API примитивов (промптов или ресурсов)
    /// </summary>
    public static class WebUiApi
    {
        public static void MapUiApi(this WebApplication app)
        {
            // получение определенного примитива
            app.MapGet("/{primitive}/{key}", async (string primitive, string key, ArtifactService svc, CancellationToken ct) =>
            {
                var data = await svc.GetActiveAsync(Parse(primitive), key, ct);
                if (data is null) return Results.NotFound();

                return Results.Json(data);
            });

            // получение списка примитивов
            app.MapGet("/{primitive}", async (string primitive, ArtifactService svc, string? q, CancellationToken ct)
                => Results.Json(await svc.ListAsync(Parse(primitive), q, ct)));

            // получение истории версий определенного примитива
            app.MapGet("/{primitive}/{key}/versions", async (string primitive, string key, ArtifactService svc, CancellationToken ct)
                => Results.Json(await svc.HistoryAsync(Parse(primitive), key, ct)));

            // создание новой версии определенного примитива
            app.MapPost("/{primitive}/{key}/versions", async (HttpContext ctx, string primitive, string key, ArtifactService svc, CancellationToken ct) =>
            {
                var login = ctx.Request.Headers["x-user-login"].ToString();
                if (string.IsNullOrWhiteSpace(login)) return Results.BadRequest(new { error = "LOGIN_REQUIRED" });

                var payload = await ctx.Request.ReadFromJsonAsync<NewVersionDto>(cancellationToken: ct);
                if (payload is null) return Results.BadRequest(new { error = "BAD_BODY" });

                var v = await svc.CreatePendingVersionAsync(Parse(primitive), key,
                                                            payload.Title, payload.Body, payload.Template, payload.Placeholders,
                                                            login, ct);
                return Results.Json(new { v.Version, v.Status });
            });

            // апрув версии определенного примитива
            app.MapPost("/{primitive}/{key}/versions/{version}/approve", async (HttpContext ctx, string primitive, string key, string version, ArtifactService svc, CancellationToken ct) =>
            {
                var login = ctx.Request.Headers["x-user-login"].ToString();
                if (string.IsNullOrWhiteSpace(login)) return Results.BadRequest(new { error = "LOGIN_REQUIRED" });

                if (!int.TryParse(version, out var ver)) return Results.BadRequest(new { error = "BAD_VERSION" });
                await svc.ApproveAsync(Parse(primitive), key, ver, login, ct);
                return Results.Ok();
            });

            // удаление артефакта (и всех его версий) — только для админов
            app.MapDelete("/{primitive}/{key}", async (HttpContext ctx, string primitive, string key, ArtifactService svc, CancellationToken ct) =>
            {
                var login = ctx.Request.Headers["x-user-login"].ToString();
                if (string.IsNullOrWhiteSpace(login)) return Results.BadRequest(new { error = "LOGIN_REQUIRED" });

                try
                {
                    await svc.DeleteArtifactAsync(Parse(primitive), key, login, ct);
                    return Results.Ok();
                }
                catch (UnauthorizedAccessException)
                {
                    return Results.Unauthorized();
                }
            });

            static ArtifactType Parse(string primitive) => primitive.ToLower() switch
            {
                "prompt" or "prompts" => ArtifactType.Prompt,
                "resource" or "resources" => ArtifactType.Resource,
                _ => throw new Exception("BAD_TYPE")
            };
        }

        public sealed record NewVersionDto(string Title, string? Body, string? Template, string[]? Placeholders);
    }
}