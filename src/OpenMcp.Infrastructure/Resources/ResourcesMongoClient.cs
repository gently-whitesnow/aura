using OpenMcp.Domain.Resources.Models;
using MongoDB.Driver;
using OpenMcp.Infrastructure.Primitives;
using OpenMcp.Infrastructure.Mongo;
using OpenMcp.Domain.Resources;
using OpenMcp.Domain.Models;

namespace OpenMcp.Infrastructure.Resources;

public sealed class ResourcesMongoClient(MongoCollectionsProvider store) : PrimitivesMongoClient<ResourceRecord, ResourceRecordDbModel>, IResourcesMongoClient
{
    protected override IMongoCollection<ResourceRecordDbModel> PrimitivesCollection => store.Resources;

    public async Task<ResourceRecord[]> ListApprovedResourcesMetadataAsync(string[] names, CancellationToken ct)
    {
        var filter = Builders<ResourceRecordDbModel>.Filter
            .In(r => r.Name, names)
            & Builders<ResourceRecordDbModel>.Filter.Eq(r => r.Status, VersionStatus.Approved);

        var resources = await PrimitivesCollection
            .Find(filter)
            .ToListAsync(ct);
        return resources.Select(r => r.ToDomain()).ToArray();
    }
}