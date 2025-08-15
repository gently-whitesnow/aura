using System.Collections.Concurrent;
using OpenMcp.Domain.Interfaces;
using ModelContextProtocol;
using ModelContextProtocol.Protocol;
using ModelContextProtocol.Server;

namespace OpenMcp.Server;

public interface IResourceSubscriptionManager
{
    void Subscribe(string uri, IMcpServer server);
    void Unsubscribe(string uri, string? sessionId);
}

public sealed class ResourceSubscriptionManager : IResourceSubscriptionManager, IResourceChangeNotifier
{
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, IMcpServer>> _uriToSessions =
        new(StringComparer.OrdinalIgnoreCase);

    public void Subscribe(string uri, IMcpServer server)
    {
        if (string.IsNullOrWhiteSpace(uri) || server.SessionId is null) return;
        var bySession = _uriToSessions.GetOrAdd(uri, _ => new(StringComparer.Ordinal));
        bySession[server.SessionId] = server;
    }

    public void Unsubscribe(string uri, string? sessionId)
    {
        if (string.IsNullOrWhiteSpace(uri) || string.IsNullOrWhiteSpace(sessionId)) return;
        if (_uriToSessions.TryGetValue(uri, out var bySession))
        {
            bySession.TryRemove(sessionId, out _);
            if (bySession.Count == 0) _uriToSessions.TryRemove(uri, out _);
        }
    }

    public async Task NotifyUpdatedAsync(string resourceUri, CancellationToken ct = default)
    {
        if (!_uriToSessions.TryGetValue(resourceUri, out var bySession) || bySession.Count == 0) return;

        // take a snapshot to avoid concurrent modification surprises during iteration
        var targets = bySession.ToArray();
        foreach (var (_, server) in targets)
        {
            try
            {
                await server.SendNotificationAsync(
                    NotificationMethods.ResourceUpdatedNotification,
                    new ResourceUpdatedNotificationParams { Uri = resourceUri },
                    cancellationToken: ct);
            }
            catch
            {
                if (server.SessionId is { } sid)
                {
                    bySession.TryRemove(sid, out _);
                }
            }
        }
    }
}


