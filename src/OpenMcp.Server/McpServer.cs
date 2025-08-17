using System.Text.Json;
using ModelContextProtocol.Protocol;
using ModelContextProtocol;
using OpenMcp.Domain.Prompts;
using OpenMcp.Domain.Resources;
using OpenMcp.Domain.Prompts.Models;

namespace OpenMcp.Server;

public static class McpServer
{
    public static void AddOpenMcpServer(this WebApplicationBuilder builder)
    {
        builder.Services.AddMcpServer(options =>
        {
            options.ServerInfo = new Implementation
            {
                Name = "open-mcp",
                Version = "0.1.0"
            };
        })
        .WithHttpTransport()
        .WithListPromptsHandler(async (ctx, ct) =>
        {
            var svc = ctx.Services!.GetRequiredService<PromptsService>();
            var list = await svc.ListLatestApprovedAsync(null, ct);
            await ctx.Server.SendNotificationAsync(
                NotificationMethods.LoggingMessageNotification,
                new LoggingMessageNotificationParams
                {
                    Level = LoggingLevel.Debug,
                    Logger = "open-mcp",
                    Data = JsonSerializer.SerializeToElement($"Prompts listed: {list.Count}")
                },
                cancellationToken: ct);
            return new ListPromptsResult
            {
                Prompts = list.Select(p => new Prompt
                {
                    Name = p.Name,
                    Title = p.Title,
                    Arguments = p.Arguments?.Select(a => new PromptArgument
                    {
                        Name = a.Name,
                        Title = a.Title,
                        Required = a.Required
                    }).ToList()
                }).ToList()
            };
        })
        .WithGetPromptHandler(async (ctx, ct) =>
        {
            var svc = ctx.Services!.GetRequiredService<PromptsService>();
            var (prompts, resources) = await svc.GetLatestApprovedWithResourcesAsync(ctx.Params!.Name, ct);
            if (prompts == null) throw new McpException("PROMPT_NOT_FOUND");

            var result = new GetPromptResult
            {
            };
            await ctx.Server.SendNotificationAsync(
                NotificationMethods.LoggingMessageNotification,
                new LoggingMessageNotificationParams
                {
                    Level = LoggingLevel.Debug,
                    Logger = "open-mcp",
                    Data = JsonSerializer.SerializeToElement($"Prompt fetched: {ctx.Params!.Name}")
                },
                cancellationToken: ct);

            var arguments = ctx.Params?.Arguments;
            foreach (var m in prompts.Messages)
            {
                var role = string.Equals(m.Role, "assistant", StringComparison.OrdinalIgnoreCase)
                        ? Role.Assistant
                        : Role.User;

                ContentBlock content;
                if (m.Content is PromptTextContentBlock textContent)
                {
                    content = new TextContentBlock { Text = PromptTextFormatter.ApplyArguments(textContent.Text, arguments) };
                }
                else if (m.Content is PromptResourceLinkBlock resourceLinkContent)
                {
                    var res = resources?.OrderByDescending(r => r.Version).FirstOrDefault(r => r.Name == resourceLinkContent.InternalName);
                    if (res == null) throw new McpException("RESOURCE_NOT_FOUND");
                    content = new EmbeddedResourceBlock
                    {
                        Resource = new TextResourceContents
                        {
                            Text = res.Text ?? throw new McpException("RESOURCE_NOT_FOUND"),
                            MimeType = res.MimeType ?? "text/plain",
                            Uri = $"open-mcp://resource/{res.Name}",
                        }
                    };
                }
                else
                {
                    throw new McpException("UNSUPPORTED_CONTENT_TYPE");
                }

                result.Messages.Add(new PromptMessage
                {
                    Role = role,
                    Content = content
                });
            }
            return result;
        })
        .WithListResourcesHandler(async (ctx, ct) =>
        {
            var svc = ctx.Services!.GetRequiredService<ResourcesService>();
            var list = await svc.ListLatestApprovedAsync(null, ct);
            await ctx.Server.SendNotificationAsync(
                NotificationMethods.LoggingMessageNotification,
                new LoggingMessageNotificationParams
                {
                    Level = LoggingLevel.Debug,
                    Logger = "open-mcp",
                    Data = JsonSerializer.SerializeToElement($"Resources listed: {list.Count}")
                },
                cancellationToken: ct);
            return new ListResourcesResult
            {
                Resources = list.Select(r => new Resource
                {
                    Name = r.Name,
                    Title = r.Title,
                    Uri = $"open-mcp://resource/{r.Name}",
                    MimeType = r.MimeType ?? "text/plain",
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
            var prefix = "open-mcp://resource/";
            var name = uri.StartsWith(prefix, StringComparison.OrdinalIgnoreCase) ? uri[prefix.Length..] : uri;
            var data = await svc.GetLatestApprovedAsync(name, ct)
                    ?? throw new McpException("RESOURCE_NOT_FOUND");
            await ctx.Server.SendNotificationAsync(
                NotificationMethods.LoggingMessageNotification,
                new LoggingMessageNotificationParams
                {
                    Level = LoggingLevel.Debug,
                    Logger = "open-mcp",
                    Data = JsonSerializer.SerializeToElement($"Resource read: {uri} => {name}")
                },
                cancellationToken: ct);

            // Return content from DB when available; fallback to URI
            var textContent = data.Text;
            if (!string.IsNullOrEmpty(textContent))
            {
                return new ReadResourceResult
                {
                    Contents =
                    {
                        new TextResourceContents
                        {
                            Text = textContent,
                            MimeType = data.MimeType ?? "text/plain",
                            Uri = $"open-mcp://resource/{name}"
                        }
                    }
                };
            }

            // Fallback: return URI as text (client may resolve it)
            return new ReadResourceResult
            {
                Contents =
                {
                    new TextResourceContents
                    {
                        Text = data.Uri ?? "not supported",
                        MimeType = data.MimeType ?? "text/plain",
                        Uri = $"open-mcp://resource/{name}"
                    }
                }
            };
        })
        .WithSubscribeToResourcesHandler((ctx, ct) =>
        {
            var mgr = ctx.Services!.GetRequiredService<IResourceSubscriptionManager>();
            var uri = ctx.Params!.Uri!;
            mgr.Subscribe(uri, ctx.Server);
            _ = ctx.Server.SendNotificationAsync(
                NotificationMethods.LoggingMessageNotification,
                new LoggingMessageNotificationParams
                {
                    Level = LoggingLevel.Debug,
                    Logger = "open-mcp",
                    Data = JsonSerializer.SerializeToElement($"Subscribed: {ctx.Server.SessionId} -> {uri}")
                },
                cancellationToken: ct);
            return ValueTask.FromResult(new EmptyResult());
        })
        .WithUnsubscribeFromResourcesHandler((ctx, ct) =>
        {
            var mgr = ctx.Services!.GetRequiredService<IResourceSubscriptionManager>();
            var uri = ctx.Params!.Uri!;
            mgr.Unsubscribe(uri, ctx.Server.SessionId);
            _ = ctx.Server.SendNotificationAsync(
                NotificationMethods.LoggingMessageNotification,
                new LoggingMessageNotificationParams
                {
                    Level = LoggingLevel.Debug,
                    Logger = "open-mcp",
                    Data = JsonSerializer.SerializeToElement($"Unsubscribed: {ctx.Server.SessionId} -X- {uri}")
                },
                cancellationToken: ct);
            return ValueTask.FromResult(new EmptyResult());
        })
        .WithSetLoggingLevelHandler((ctx, ct) => ValueTask.FromResult(new EmptyResult()));
    }
}