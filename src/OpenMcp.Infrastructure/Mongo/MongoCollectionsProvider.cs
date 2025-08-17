using OpenMcp.Infrastructure.Models;
using MongoDB.Driver;
using OpenMcp.Infrastructure.Prompts;
using OpenMcp.Infrastructure.Resources;

namespace OpenMcp.Infrastructure.Mongo;

public sealed class MongoCollectionsProvider
{
    public IMongoDatabase Db { get; }
    public IMongoCollection<AdminDbModel> Admins => Db.GetCollection<AdminDbModel>("admins");
    public IMongoCollection<PromptRecordDbModel> Prompts => Db.GetCollection<PromptRecordDbModel>("prompts");
    public IMongoCollection<ResourceRecordDbModel> Resources => Db.GetCollection<ResourceRecordDbModel>("resources");

    public MongoCollectionsProvider(string conn, string dbName)
    {
        var client = new MongoClient(conn);
        Db = client.GetDatabase(dbName);
        EnsureIndexes();
    }

    void EnsureIndexes()
    {
        // Уникальный login
        var adIdx = Builders<AdminDbModel>.IndexKeys.Ascending(x => x.Login);
        Admins.Indexes.CreateOne(new CreateIndexModel<AdminDbModel>(adIdx, new CreateIndexOptions { Unique = true }));

        // Уникальный (name, version) для промптов
        var pIdx = Builders<PromptRecordDbModel>.IndexKeys
            .Ascending(x => x.Name).Ascending(x => x.Version);
        Prompts.Indexes.CreateOne(new CreateIndexModel<PromptRecordDbModel>(pIdx, new CreateIndexOptions { Unique = true }));

        // Уникальный (name, version) для ресурсов
        var rIdx = Builders<ResourceRecordDbModel>.IndexKeys
            .Ascending(x => x.Name).Ascending(x => x.Version);
        Resources.Indexes.CreateOne(new CreateIndexModel<ResourceRecordDbModel>(rIdx, new CreateIndexOptions { Unique = true }));
    }
}


