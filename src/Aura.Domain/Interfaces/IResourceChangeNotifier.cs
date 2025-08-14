namespace Aura.Domain.Interfaces;

/// <summary>
/// Abstraction for notifying interested parties that a resource URI was updated.
/// Implemented in the server layer to fan out MCP notifications to subscribed clients.
/// </summary>
public interface IResourceChangeNotifier
{
    Task NotifyUpdatedAsync(string resourceUri, CancellationToken ct = default);
}


