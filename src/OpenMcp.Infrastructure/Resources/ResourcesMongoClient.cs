using OpenMcp.Domain.Resources.Models;
using MongoDB.Driver;
using OpenMcp.Infrastructure.Primitives;
using OpenMcp.Infrastructure.Mongo;

namespace OpenMcp.Infrastructure.Resources;

public sealed class ResourcesMongoClient(MongoCollectionsProvider store) : PrimitivesMongoClient<ResourceRecord, ResourceRecordDbModel>
{
    protected override IMongoCollection<ResourceRecordDbModel> PrimitivesCollection => store.Resources;

}