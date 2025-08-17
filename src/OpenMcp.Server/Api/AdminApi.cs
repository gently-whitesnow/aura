using OpenMcp.Domain.Prompts;
using OpenMcp.Domain.Resources;

namespace OpenMcp.Server.Api
{
    public static class AdminApi
    {
        public static void MapAdminApi(this WebApplication app)
        {
            // смена статуса версии (Pending/Approved/Declined) — только для админов
            app.MapPost("v1/{primitive}/{key}/versions/{version}/status", async (HttpContext ctx, string primitive, string key, string version, PromptsService prompts, ResourcesService resources, CancellationToken ct) =>
            {
                var login = HttpContextExtensions.GetLogin(ctx);
                if (string.IsNullOrWhiteSpace(login)) return Results.BadRequest(new { error = "LOGIN_REQUIRED" });

                if (!int.TryParse(version, out var ver)) return Results.BadRequest(new { error = "BAD_VERSION" });

                var body = await ctx.Request.ReadFromJsonAsync<StatusDto>(cancellationToken: ct);
                if (body is null) return Results.BadRequest(new { error = "BAD_BODY" });

                try
                {
                    var primitiveType = Parse(primitive);
                    switch (primitiveType)
                    {
                        case ArtifactType.Prompt:
                            await prompts.UpdateStatusAsync(key, ver, body.Status, login);
                            break;
                        case ArtifactType.Resource:
                            await resources.UpdateStatusWithNotifyAsync(key, ver, body.Status, login);
                            break;
                        default:
                            return Results.BadRequest(new { error = "BAD_TYPE" });
                    }
                    return Results.Ok();
                }
                catch (UnauthorizedAccessException)
                {
                    return Results.Unauthorized();
                }
            });

            // удаление артефакта (и всех его версий) — только для админов
            app.MapDelete("v1/{primitive}/{key}", async (HttpContext ctx, string primitive, string key, PromptsService prompts, ResourcesService resources, CancellationToken ct) =>
            {
                var login = HttpContextExtensions.GetLogin(ctx);
                if (string.IsNullOrWhiteSpace(login)) return Results.BadRequest(new { error = "LOGIN_REQUIRED" });

                try
                {
                    var primitiveType = Parse(primitive);
                    switch (primitiveType)
                    {
                        case ArtifactType.Prompt:
                            await prompts.DeleteAsync(key, login);
                            break;
                        case ArtifactType.Resource:
                            await resources.DeleteWithNotifyAsync(key, login);
                            break;
                    }
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

        enum ArtifactType
        {
            Prompt,
            Resource
        }

        public sealed record StatusDto(OpenMcp.Domain.Models.VersionStatus Status);
    }
}