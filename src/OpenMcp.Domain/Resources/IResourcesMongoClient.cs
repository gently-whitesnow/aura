using OpenMcp.Domain.Resources.Models;

namespace OpenMcp.Domain.Resources;

public interface IResourcesMongoClient
{
    Task<List<ResourceRecord>> ListResourcesMetadataAsync(string[] names, CancellationToken ct);
}