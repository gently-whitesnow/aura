using OpenMcp.Domain.Prompts;
using OpenMcp.Domain.Prompts.Models;

namespace OpenMcp.Server.Api
{
    public static class PromptsApi
    {
        public static void MapPromptsApi(this WebApplication app)
        {
            // Получение актуального промпта (Последний апрув, иначе последняя версия)
            app.MapGet("v1/prompts/{name}", async (string name, PromptsService svc, CancellationToken ct) =>
            {
                var data = await svc.GetActualAsync(name, ct);
                if (data is null) return Results.NotFound();
                return Results.Json(data);
            });

            // Получение всех актуальных промптов (Последние апрувы или последние версии)
            app.MapGet("v1/prompts", async (string? query, PromptsService svc, CancellationToken ct) =>
            {
                var data = await svc.ListActualAsync(query, ct);
                return Results.Json(data);
            });

            // Получение истории версий промпта
            app.MapGet("v1/prompts/{name}/versions", async (string name, PromptsService svc, CancellationToken ct)
                => Results.Json(await svc.HistoryAsync(name, ct)));

            // Создание новой версии промпта
            app.MapPost("v1/prompts/{name}/versions", async (HttpContext ctx, string name, PromptsService svc, CancellationToken ct) =>
            {
                var login = HttpContextExtensions.GetLogin(ctx);
                if (string.IsNullOrWhiteSpace(login)) return Results.BadRequest(new { error = "LOGIN_REQUIRED" });

                var payload = await ctx.Request.ReadFromJsonAsync<NewPromptVersionDto>(cancellationToken: ct);
                if (payload is null) return Results.BadRequest(new { error = "BAD_BODY" });

                var v = await svc.CreatePendingAsync(name, payload.Title, payload.Messages ?? new List<PromptMessageRecord>(), payload.Arguments, login, ct);
                return Results.Json(new { v.Version, v.Status });
            });
        }

        public sealed record NewPromptVersionDto(string? Title, IList<PromptMessageRecord>? Messages, IList<PromptArgumentRecord>? Arguments);
    }
}