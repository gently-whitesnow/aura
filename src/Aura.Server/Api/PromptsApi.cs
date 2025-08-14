using Aura.Domain.Prompts;
using Aura.Domain.Prompts.Models;

namespace Aura.Server.Api
{
    public static class PromptsApi
    {
        public static void MapPromptsApi(this WebApplication app)
        {
            // Получение активного промпта
            app.MapGet("v2/prompts/{name}", async (string name, PromptsService svc, CancellationToken ct) =>
            {
                var data = await svc.GetActiveAsync(name, ct);
                if (data is null) return Results.NotFound();
                return Results.Json(data);
            });

            // Получение истории версий промпта
            app.MapGet("v2/prompts/{name}/versions", async (string name, PromptsService svc, CancellationToken ct)
                => Results.Json(await svc.HistoryAsync(name, ct)));

            // Создание новой версии промпта
            app.MapPost("v2/prompts/{name}/versions", async (HttpContext ctx, string name, PromptsService svc, CancellationToken ct) =>
            {
                var login = HttpContextExtensions.GetLogin(ctx);
                if (string.IsNullOrWhiteSpace(login)) return Results.BadRequest(new { error = "LOGIN_REQUIRED" });

                var payload = await ctx.Request.ReadFromJsonAsync<NewPromptVersionDto>(cancellationToken: ct);
                if (payload is null) return Results.BadRequest(new { error = "BAD_BODY" });

                var v = await svc.CreatePendingAsync(name, payload.Title, payload.Messages ?? new List<PromptMessageRecord>(), payload.Arguments, login, ct);
                return Results.Json(new { v.Version, v.Status });
            });

            // Апрув версии промпта
            app.MapPost("v2/prompts/{name}/versions/{version}/approve", async (HttpContext ctx, string name, string version, PromptsService svc, CancellationToken ct) =>
            {
                var login = HttpContextExtensions.GetLogin(ctx);
                if (string.IsNullOrWhiteSpace(login)) return Results.BadRequest(new { error = "LOGIN_REQUIRED" });

                if (!int.TryParse(version, out var ver)) return Results.BadRequest(new { error = "BAD_VERSION" });
                await svc.ApproveAsync(name, ver, login, ct);
                return Results.Ok();
            });
        }

        public sealed record NewPromptVersionDto(string? Title, IList<PromptMessageRecord>? Messages, IList<PromptArgumentRecord>? Arguments);
    }
}