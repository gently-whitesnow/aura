using Aura.Domain.Models;
using Aura.Infrastructure.Models;
using MongoDB.Driver;

namespace Aura.Infrastructure;

public sealed class MongoCollectionsProvider
{
    public IMongoDatabase Db { get; }
    public IMongoCollection<ArtifactDbModel> Artifacts => Db.GetCollection<ArtifactDbModel>("artifacts");
    public IMongoCollection<ArtifactVersionDbModel> Versions => Db.GetCollection<ArtifactVersionDbModel>("artifact_versions");
    public IMongoCollection<AdminDbModel> Admins => Db.GetCollection<AdminDbModel>("admins");

    public MongoCollectionsProvider(string conn, string dbName)
    {
        var client = new MongoClient(conn);
        Db = client.GetDatabase(dbName);
        EnsureIndexes();
    }

    void EnsureIndexes()
    {
        // Уникальный (type,key)
        var aIdx = Builders<ArtifactDbModel>.IndexKeys
            .Ascending(x => x.Type).Ascending(x => x.Key);
        Artifacts.Indexes.CreateOne(new CreateIndexModel<ArtifactDbModel>(aIdx, new CreateIndexOptions { Unique = true }));

        // Уникальный (artifactKey,type,version)
        var vIdx = Builders<ArtifactVersionDbModel>.IndexKeys
            .Ascending(x => x.ArtifactKey).Ascending(x => x.Type).Ascending(x => x.Version);
        Versions.Indexes.CreateOne(new CreateIndexModel<ArtifactVersionDbModel>(vIdx, new CreateIndexOptions { Unique = true }));

        // Уникальный login
        var adIdx = Builders<AdminDbModel>.IndexKeys.Ascending(x => x.Login);
        Admins.Indexes.CreateOne(new CreateIndexModel<AdminDbModel>(adIdx, new CreateIndexOptions { Unique = true }));
    }
}


