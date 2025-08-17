using OpenMcp.Domain.Resources.Models;

namespace OpenMcp.Domain.Resources;

public interface IResourcesMongoClient
{
    Task<ResourceRecord[]> ListApprovedResourcesMetadataAsync(string[] names, CancellationToken ct);
}