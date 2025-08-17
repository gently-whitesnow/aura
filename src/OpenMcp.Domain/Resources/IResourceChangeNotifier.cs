namespace OpenMcp.Domain.Resources;

public interface IResourceChangeNotifier
{
    Task NotifyUpdatedAsync(string resourceUri);
}


