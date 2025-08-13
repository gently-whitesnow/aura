using Aura.Domain;
using Aura.Infrastructure;

public static class AdminApi
{
    public static void MapAdminApi(this WebApplication app)
    {
        app.MapGet("/admin/prompts", async (ArtifactService svc, string? q, CancellationToken ct)
            => Results.Json((await svc.ListAsync(ArtifactType.Prompt, q, ct))
                                     .Select(a => new { a.Key, a.Title, a.ActiveVersion })));

        app.MapGet("/admin/resources", async (ArtifactService svc, string? q, CancellationToken ct)
            => Results.Json((await svc.ListAsync(ArtifactType.Resource, q, ct))
                                     .Select(a => new { a.Key, a.Title, a.ActiveVersion })));

        app.MapGet("/admin/{type}/{key}/versions", async (string type, string key, ArtifactService svc, CancellationToken ct)
            => Results.Json((await svc.HistoryAsync(Parse(type), key, ct))
                                     .Select(v => new { v.Version, v.Status, v.CreatedBy, v.CreatedAt, v.ApprovedBy, v.ApprovedAt })));

        app.MapPost("/admin/{type}/{key}/versions", async (HttpContext ctx, string type, string key, ArtifactService svc, CancellationToken ct) =>
        {
            var login = ctx.Request.Headers["x-user-login"].ToString();
            if (string.IsNullOrWhiteSpace(login)) return Results.BadRequest(new { error = "LOGIN_REQUIRED" });

            var payload = await ctx.Request.ReadFromJsonAsync<NewVersionDto>(cancellationToken: ct);
            if (payload is null) return Results.BadRequest(new { error = "BAD_BODY" });

            var v = await svc.CreatePendingVersionAsync(Parse(type), key,
                                                        payload.Title, payload.Body, payload.Template, payload.Placeholders,
                                                        login, ct);
            return Results.Json(new { v.Version, v.Status });
        });

        app.MapPost("/admin/{type}/{key}/versions/{version}/approve", async (HttpContext ctx, string type, string key, string version, ArtifactService svc, CancellationToken ct) =>
        {
            var login = ctx.Request.Headers["x-user-login"].ToString();
            if (string.IsNullOrWhiteSpace(login)) return Results.BadRequest(new { error = "LOGIN_REQUIRED" });

            if (!int.TryParse(version, out var ver)) return Results.BadRequest(new { error = "BAD_VERSION" });
            await svc.ApproveAsync(Parse(type), key, ver, login, ct);
            return Results.Ok();
        });

        static ArtifactType Parse(string type) => type.ToLower() switch
        {
            "prompt" or "prompts" => ArtifactType.Prompt,
            "resource" or "resources" => ArtifactType.Resource,
            _ => throw new Exception("BAD_TYPE")
        };
    }

    public sealed record NewVersionDto(string Title, string? Body, string? Template, string[]? Placeholders, string? Version);
}