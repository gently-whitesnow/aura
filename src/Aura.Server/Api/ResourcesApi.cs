using Aura.Domain.Resources;
using Aura.Domain.Resources.Models;

namespace Aura.Server.Api
{
    public static class ResourcesApi
    {
        public static void MapResourcesApi(this WebApplication app)
        {
            // Получение активного ресурса
            app.MapGet("v2/resources/{name}", async (string name, ResourcesService svc, CancellationToken ct) =>
            {
                var data = await svc.GetActiveAsync(name, ct);
                if (data is null) return Results.NotFound();
                return Results.Json(data);
            });

            // Получение истории версий ресурса
            app.MapGet("v2/resources/{name}/versions", async (string name, ResourcesService svc, CancellationToken ct)
                => Results.Json(await svc.HistoryAsync(name, ct)));

            // Создание новой версии ресурса
            app.MapPost("v2/resources/{name}/versions", async (HttpContext ctx, string name, ResourcesService svc, CancellationToken ct) =>
            {
                var login = HttpContextExtensions.GetLogin(ctx);
                if (string.IsNullOrWhiteSpace(login)) return Results.BadRequest(new { error = "LOGIN_REQUIRED" });

                var payload = await ctx.Request.ReadFromJsonAsync<NewResourceVersionDto>(cancellationToken: ct);
                if (payload is null || string.IsNullOrWhiteSpace(payload.Uri)) return Results.BadRequest(new { error = "BAD_BODY" });

                var v = await svc.CreatePendingAsync(
                    name,
                    payload.Title,
                    payload.Uri!,
                    payload.Text,
                    payload.Description,
                    payload.MimeType,
                    payload.Annotations,
                    payload.Size,
                    login,
                    ct);
                return Results.Json(new { v.Version, v.Status });
            });

            // Апрув версии ресурса
            app.MapPost("v2/resources/{name}/versions/{version}/approve", async (HttpContext ctx, string name, string version, ResourcesService svc, CancellationToken ct) =>
            {
                var login = HttpContextExtensions.GetLogin(ctx);
                if (string.IsNullOrWhiteSpace(login)) return Results.BadRequest(new { error = "LOGIN_REQUIRED" });

                if (!int.TryParse(version, out var ver)) return Results.BadRequest(new { error = "BAD_VERSION" });
                await svc.ApproveAsync(name, ver, login, ct);
                return Results.Ok();
            });
        }

        public sealed record NewResourceVersionDto(
            string? Title,
            string? Uri,
            string? Text,
            string? Description,
            string? MimeType,
            AnnotationsRecord? Annotations,
            long? Size
        );
    }
}


