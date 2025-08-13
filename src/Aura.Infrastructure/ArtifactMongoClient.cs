using System.Text.RegularExpressions;
using Aura.Domain;
using Aura.Domain.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;

namespace Aura.Infrastructure;

public sealed class ArtifactMongoClient : IArtifactRepository
{
    private readonly IMongoCollection<Artifact> _artifacts;

    public ArtifactMongoClient(MongoStore store)
    {
        _artifacts = store.Artifacts;
    }

    public async Task<Artifact?> GetAsync(ArtifactType type, string key, CancellationToken ct)
    {
        return await _artifacts
            .Find(a => a.Type == type && a.Key == key)
            .FirstOrDefaultAsync(ct);
    }

    public async Task UpsertAsync(Artifact artifact, CancellationToken ct)
    {
        // гарантирует уникальность (type,key) через уникальный индекс
        var filter = Builders<Artifact>.Filter.Where(a => a.Type == artifact.Type && a.Key == artifact.Key);

        var update = Builders<Artifact>.Update
            .SetOnInsert(a => a.Type, artifact.Type)
            .SetOnInsert(a => a.Key, artifact.Key)
            .SetOnInsert(a => a.CreatedAt, artifact.CreatedAt)
            .SetOnInsert(a => a.CreatedBy, artifact.CreatedBy)
            .Set(a => a.Title, artifact.Title)
            .Set(a => a.UpdatedAt, artifact.UpdatedAt)
            .Set(a => a.UpdatedBy, artifact.UpdatedBy);

        _ = await _artifacts.FindOneAndUpdateAsync(
            filter, update,
            new FindOneAndUpdateOptions<Artifact>
            {
                IsUpsert = true,
                ReturnDocument = ReturnDocument.After
            },
            ct);
    }

    public async Task SetActiveVersionAsync(ArtifactType type, string key, int version, string updatedBy, DateTime now, CancellationToken ct)
    {
        var filter = Builders<Artifact>.Filter.Where(a => a.Type == type && a.Key == key);
        var update = Builders<Artifact>.Update
            .Set(a => a.ActiveVersion, version)
            .Set(a => a.UpdatedAt, now)
            .Set(a => a.UpdatedBy, updatedBy);

        var res = await _artifacts.UpdateOneAsync(filter, update, cancellationToken: ct);
        if (res.MatchedCount == 0)
            throw new InvalidOperationException("ARTIFACT_NOT_FOUND");
    }

    public async Task<List<Artifact>> ListAsync(ArtifactType type, string? query, CancellationToken ct)
    {
        var filter = Builders<Artifact>.Filter.Eq(a => a.Type, type);

        if (!string.IsNullOrWhiteSpace(query))
        {
            // поиск по title (регистронезависимо)
            var rx = new BsonRegularExpression(new Regex(Regex.Escape(query), RegexOptions.IgnoreCase));
            filter &= Builders<Artifact>.Filter.Regex(a => a.Title, rx);
        }

        return await _artifacts
            .Find(filter)
            .SortBy(a => a.Title)
            .ToListAsync(ct);
    }
}
