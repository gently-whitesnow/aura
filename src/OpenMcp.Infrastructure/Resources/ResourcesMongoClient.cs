using OpenMcp.Domain.Resources.Models;
using MongoDB.Driver;
using OpenMcp.Infrastructure.Primitives;
using OpenMcp.Infrastructure.Mongo;
using OpenMcp.Domain.Resources;

namespace OpenMcp.Infrastructure.Resources;

public sealed class ResourcesMongoClient(MongoCollectionsProvider store) : PrimitivesMongoClient<ResourceRecord, ResourceRecordDbModel>, IResourcesMongoClient
{
    protected override IMongoCollection<ResourceRecordDbModel> PrimitivesCollection => store.Resources;

    public async Task<List<ResourceRecord>> ListResourcesMetadataAsync(string[] names, CancellationToken ct)
    {
        var filter = Builders<ResourceRecordDbModel>.Filter.In(r => r.Name, names);
        var resources = await PrimitivesCollection.Find(filter).ToListAsync(ct);
        return resources.Select(r => r.ToDomain()).ToList();
    }
}