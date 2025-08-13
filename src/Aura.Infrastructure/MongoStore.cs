using Aura.Domain.Models;
using MongoDB.Driver;

namespace Aura.Infrastructure;

public sealed class MongoStore
{
    public IMongoDatabase Db { get; }
    public IMongoCollection<Artifact> Artifacts => Db.GetCollection<Artifact>("artifacts");
    public IMongoCollection<ArtifactVersion> Versions => Db.GetCollection<ArtifactVersion>("artifact_versions");
    public IMongoCollection<Admin> Admins => Db.GetCollection<Admin>("admins");

    public MongoStore(string conn, string dbName)
    {
        var client = new MongoClient(conn);
        Db = client.GetDatabase(dbName);
        EnsureIndexes();
    }

    void EnsureIndexes()
    {
        // Уникальный (type,key)
        var aIdx = Builders<Artifact>.IndexKeys
            .Ascending(x => x.Type).Ascending(x => x.Key);
        Artifacts.Indexes.CreateOne(new CreateIndexModel<Artifact>(aIdx, new CreateIndexOptions { Unique = true }));

        // Уникальный (artifactKey,type,version)
        var vIdx = Builders<ArtifactVersion>.IndexKeys
            .Ascending(x => x.ArtifactKey).Ascending(x => x.Type).Ascending(x => x.Version);
        Versions.Indexes.CreateOne(new CreateIndexModel<ArtifactVersion>(vIdx, new CreateIndexOptions { Unique = true }));

        // Уникальный login
        var adIdx = Builders<Admin>.IndexKeys.Ascending(x => x.Login);
        Admins.Indexes.CreateOne(new CreateIndexModel<Admin>(adIdx, new CreateIndexOptions { Unique = true }));
    }
}


