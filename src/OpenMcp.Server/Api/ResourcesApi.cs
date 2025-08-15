using OpenMcp.Domain.Resources;
using OpenMcp.Domain.Resources.Models;

namespace OpenMcp.Server.Api
{
    public static class ResourcesApi
    {
        public static void MapResourcesApi(this WebApplication app)
        {
            // Получение актуального ресурса (Последний апрув, иначе последняя версия)
            app.MapGet("v1/resources/{name}", async (string name, ResourcesService svc, CancellationToken ct) =>
            {
                var data = await svc.GetActualAsync(name, ct);
                if (data is null) return Results.NotFound();
                return Results.Json(data);
            });

            // Получение всех актуальных ресурсов
            app.MapGet("v1/resources", async (string? query, ResourcesService svc, CancellationToken ct) =>
            {
                var data = await svc.ListActualAsync(query, ct);
                return Results.Json(data);
            });

            // Получение истории версий ресурса
            app.MapGet("v1/resources/{name}/versions", async (string name, ResourcesService svc, CancellationToken ct)
                => Results.Json(await svc.HistoryAsync(name, ct)));

            // Создание новой версии ресурса
            app.MapPost("v1/resources/{name}/versions", async (HttpContext ctx, string name, ResourcesService svc, CancellationToken ct) =>
            {
                var login = HttpContextExtensions.GetLogin(ctx);
                if (string.IsNullOrWhiteSpace(login)) return Results.BadRequest(new { error = "LOGIN_REQUIRED" });

                var payload = await ctx.Request.ReadFromJsonAsync<NewResourceVersionDto>(cancellationToken: ct);
                if (payload is null) return Results.BadRequest(new { error = "BAD_BODY" });

                var v = await svc.CreatePendingAsync(
                    name,
                    payload.Title,
                    null,
                    payload.Text,
                    payload.Description,
                    null,
                    payload.Annotations,
                    login,
                    ct);
                return Results.Json(new { v.Version, v.Status });
            });
        }

        public sealed record NewResourceVersionDto(
            string? Title,
            string? Text,
            string? Description,
            AnnotationsRecord? Annotations
        );
    }
}


