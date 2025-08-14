using Aura.Domain;
using Aura.Domain.Models;
using ModelContextProtocol.Protocol;
using ModelContextProtocol;
using Aura.Domain.Prompts;
using Aura.Domain.Resources;
using System.Text;

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
            var svc = ctx.Services!.GetRequiredService<PromptsService>();
            var list = await svc.ListAsync(null, ct);
            return new ListPromptsResult
            {
                Prompts = list.Select(p => new Prompt
                {
                    Name = p.Name,
                    Title = p.Title,
                    Description = p.Title,
                    Arguments = p.Arguments?.Select(a => new PromptArgument
                    {
                        Name = a.Name,
                        Title = a.Title,
                        Description = a.Description,
                        Required = a.Required
                    }).ToList()
                }).ToList()
            };
        })
        .WithGetPromptHandler(async (ctx, ct) =>
        {
            var svc = ctx.Services!.GetRequiredService<PromptsService>();
            var pr = await svc.GetActiveAsync(ctx.Params!.Name, ct)
                    ?? throw new McpException("PROMPT_NOT_FOUND");

            var result = new GetPromptResult { Description = pr.Title };

            foreach (var m in pr.Messages)
            {
                result.Messages.Add(new PromptMessage
                {
                    Role = string.Equals(m.Role, "assistant", StringComparison.OrdinalIgnoreCase) ? Role.Assistant : Role.User,
                    Content = new TextContentBlock { Text = m.Text }
                });
            }
            return result;
        })
        .WithListResourcesHandler(async (ctx, ct) =>
        {
            var svc = ctx.Services!.GetRequiredService<ResourcesService>();
            var list = await svc.ListAsync(null, ct);
            return new ListResourcesResult
            {
                Resources = list.Select(r => new Resource
                {
                    Name = r.Name,
                    Title = r.Title,
                    Uri = $"aura://resource/{r.Name}",
                    MimeType = r.MimeType,
                    Description = r.Description,
                    Annotations = r.Annotations is null ? null : new Annotations
                    {
                        Audience = r.Annotations.Audience?.Select(s =>
                            string.Equals(s, "assistant", StringComparison.OrdinalIgnoreCase) ? Role.Assistant : Role.User
                        ).ToList(),
                        Priority = r.Annotations.Priority,
                        LastModified = r.Annotations.LastModified
                    },
                    Size = r.Size
                }).ToList()
            };
        })
        .WithReadResourceHandler(async (ctx, ct) =>
        {
            var svc = ctx.Services!.GetRequiredService<ResourcesService>();
            var uri = ctx.Params!.Uri;
            var prefix = "aura://resource/";
            var name = uri.StartsWith(prefix, StringComparison.OrdinalIgnoreCase) ? uri[prefix.Length..] : uri;
            var data = await svc.GetActiveAsync(name, ct)
                    ?? throw new McpException("RESOURCE_NOT_FOUND");

            // Return content from DB when available; fallback to URI
            var textContent = data.Text;
            if (!string.IsNullOrEmpty(textContent))
            {
                return new ReadResourceResult { Contents = { new TextResourceContents { Text = textContent } } };
            }

            // Fallback: return URI as text (client may resolve it)
            return new ReadResourceResult { Contents = { new TextResourceContents { Text = data.Uri } } };
        });
    }
}