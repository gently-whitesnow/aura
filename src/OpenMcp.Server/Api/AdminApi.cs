using OpenMcp.Domain.Prompts;
using OpenMcp.Domain.Resources;

namespace OpenMcp.Server.Api
{
    public static class AdminApi
    {
        public static void MapAdminApi(this WebApplication app)
        {
            // апрув версии определенного примитива
            app.MapPost("v1/{primitive}/{key}/versions/{version}/approve", async (HttpContext ctx, string primitive, string key, string version, PromptsService prompts, ResourcesService resources, CancellationToken ct) =>
            {
                var login = HttpContextExtensions.GetLogin(ctx);
                if (string.IsNullOrWhiteSpace(login)) return Results.BadRequest(new { error = "LOGIN_REQUIRED" });

                if (!int.TryParse(version, out var ver)) return Results.BadRequest(new { error = "BAD_VERSION" });
                var primitiveType = Parse(primitive);
                switch (primitiveType)
                {
                    case ArtifactType.Prompt:
                        await prompts.ApproveAsync(key, ver, login, ct);
                        break;
                    case ArtifactType.Resource:
                        await resources.ApproveAsync(key, ver, login, ct);
                        break;
                    default:
                        return Results.BadRequest(new { error = "BAD_TYPE" });
                }
                return Results.Ok();
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
                            await prompts.DeleteAsync(key, login, ct);
                            break;
                        case ArtifactType.Resource:
                            await resources.DeleteAsync(key, login, ct);
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
    }
}