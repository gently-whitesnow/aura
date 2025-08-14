using System.Text.Json;
using ModelContextProtocol.Protocol;
using ModelContextProtocol;
using Aura.Domain.Prompts;
using Aura.Domain.Resources;

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
            var list = await svc.ListLatestApprovedAsync(null, ct);
            await ctx.Server.SendNotificationAsync(
                NotificationMethods.LoggingMessageNotification,
                new LoggingMessageNotificationParams
                {
                    Level = LoggingLevel.Debug,
                    Logger = "Aura.MCP",
                    Data = JsonSerializer.SerializeToElement($"Prompts listed: {list.Count}")
                },
                cancellationToken: ct);
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
            var pr = await svc.GetLatestApprovedAsync(ctx.Params!.Name, ct)
                    ?? throw new McpException("PROMPT_NOT_FOUND");

            var result = new GetPromptResult { Description = pr.Title };
            await ctx.Server.SendNotificationAsync(
                NotificationMethods.LoggingMessageNotification,
                new LoggingMessageNotificationParams
                {
                    Level = LoggingLevel.Debug,
                    Logger = "Aura.MCP",
                    Data = JsonSerializer.SerializeToElement($"Prompt fetched: {ctx.Params!.Name}")
                },
                cancellationToken: ct);

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
            var list = await svc.ListLatestApprovedAsync(null, ct);
            await ctx.Server.SendNotificationAsync(
                NotificationMethods.LoggingMessageNotification,
                new LoggingMessageNotificationParams
                {
                    Level = LoggingLevel.Debug,
                    Logger = "Aura.MCP",
                    Data = JsonSerializer.SerializeToElement($"Resources listed: {list.Count}")
                },
                cancellationToken: ct);
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
            var data = await svc.GetLatestApprovedAsync(name, ct)
                    ?? throw new McpException("RESOURCE_NOT_FOUND");
            await ctx.Server.SendNotificationAsync(
                NotificationMethods.LoggingMessageNotification,
                new LoggingMessageNotificationParams
                {
                    Level = LoggingLevel.Debug,
                    Logger = "Aura.MCP",
                    Data = JsonSerializer.SerializeToElement($"Resource read: {uri} => {name}")
                },
                cancellationToken: ct);

            // Return content from DB when available; fallback to URI
            var textContent = data.Text;
            if (!string.IsNullOrEmpty(textContent))
            {
                return new ReadResourceResult { Contents = { new TextResourceContents { Text = textContent } } };
            }

            // Fallback: return URI as text (client may resolve it)
            return new ReadResourceResult { Contents = { new TextResourceContents { Text = data.Uri } } };
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
                    Logger = "Aura.MCP",
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
                    Logger = "Aura.MCP",
                    Data = JsonSerializer.SerializeToElement($"Unsubscribed: {ctx.Server.SessionId} -X- {uri}")
                },
                cancellationToken: ct);
            return ValueTask.FromResult(new EmptyResult());
        })
        .WithSetLoggingLevelHandler((ctx, ct) => ValueTask.FromResult(new EmptyResult()));
    }
}