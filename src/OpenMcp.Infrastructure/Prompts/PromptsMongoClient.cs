using OpenMcp.Domain.Prompts.Models;
using MongoDB.Driver;
using OpenMcp.Infrastructure.Primitives;
using OpenMcp.Infrastructure.Mongo;

namespace OpenMcp.Infrastructure.Prompts;

public sealed class PromptsMongoClient(MongoCollectionsProvider store) : PrimitivesMongoClient<PromptRecord, PromptRecordDbModel>
{
    protected override IMongoCollection<PromptRecordDbModel> PrimitivesCollection => store.Prompts;
}


