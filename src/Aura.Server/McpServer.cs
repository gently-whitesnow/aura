using Aura.Domain;
using Aura.Domain.Models;
using ModelContextProtocol.Protocol;
using ModelContextProtocol;

namespace Aura.Server;

public static class McpServer
{
    public static void AddAuraMcpServer(this WebApplicationBuilder builder)
    {
        builder.Services.AddMcpServer(options =>
        {
            options.ServerInfo = new Implementation
            {
                Name = "aura",
                Version = "0.1.0"
            };
        })
        .WithHttpTransport()
        .WithListPromptsHandler(async (ctx, ct) =>
        {
            var svc = ctx.Services!.GetRequiredService<ArtifactService>();
            var list = await svc.ListAsync(ArtifactType.Prompt, null, ct);
            return new ListPromptsResult
            {
                Prompts = list.Select(a => new Prompt
                {
                    Name = a.Key,
                    Title = a.Title,
                }).ToList()
            };
        })
        .WithGetPromptHandler(async (ctx, ct) =>
        {
            var svc = ctx.Services!.GetRequiredService<ArtifactService>();
            var data = await svc.GetActiveAsync(ArtifactType.Prompt, ctx.Params!.Name, ct)
                    ?? throw new McpException("ARTIFACT_NOT_FOUND");

            return new GetPromptResult
            {
                Description = data.Title,
                Messages =
                {
                    new PromptMessage
                    {
                        Role = Role.User,
                        Content = new TextContentBlock { Text = data.Body ?? string.Empty }
                    }
                }
            };
        })
        .WithListResourcesHandler(async (ctx, ct) =>
        {
            var svc = ctx.Services!.GetRequiredService<ArtifactService>();
            var list = await svc.ListAsync(ArtifactType.Resource, null, ct);
            return new ListResourcesResult
            {
                Resources = list.Select(a => new Resource
                {
                    Name = a.Key,
                    Title = a.Title,
                    Uri = $"aura://resource/{a.Key}",
                    MimeType = "text/plain"
                }).ToList()
            };
        })
        .WithReadResourceHandler(async (ctx, ct) =>
        {
            var svc = ctx.Services!.GetRequiredService<ArtifactService>();
            var uri = ctx.Params!.Uri;
            var prefix = "aura://resource/";
            var key = uri.StartsWith(prefix, StringComparison.OrdinalIgnoreCase) ? uri[prefix.Length..] : uri;
            var data = await svc.GetActiveAsync(ArtifactType.Resource, key, ct)
                    ?? throw new McpException("ARTIFACT_NOT_FOUND");

            return new ReadResourceResult
            {
                Contents =
                {
                    new TextResourceContents { Text = data.Template ?? string.Empty }
                }
            };
        });
    }
}