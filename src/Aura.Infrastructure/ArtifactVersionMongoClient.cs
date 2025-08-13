// Aura.Infrastructure/Repositories/MongoArtifactVersionRepository.cs
using Aura.Domain.Interfaces;
using Aura.Domain.Models;
using MongoDB.Driver;

namespace Aura.Infrastructure;

public sealed class ArtifactVersionMongoClient(MongoStore store) : IArtifactVersionRepository
{
    private readonly IMongoCollection<ArtifactVersion> _versions = store.Versions;

    public async Task<ArtifactVersion?> GetAsync(ArtifactType type, string key, int version, CancellationToken ct)
    {
        return await _versions
            .Find(v => v.Type == type && v.ArtifactKey == key && v.Version == version)
            .FirstOrDefaultAsync(ct);
    }

    public async Task InsertAsync(ArtifactVersion version, CancellationToken ct)
    {
        await _versions.InsertOneAsync(version, cancellationToken: ct);
    }

    public async Task UpdateAsync(ArtifactVersion version, CancellationToken ct)
    {
        await _versions.ReplaceOneAsync(v => v.Id == version.Id, version, cancellationToken: ct);
    }

    public async Task<List<ArtifactVersion>> HistoryAsync(ArtifactType type, string key, CancellationToken ct)
    {
        return await _versions
            .Find(v => v.Type == type && v.ArtifactKey == key)
            .SortByDescending(v => v.CreatedAt)
            .ToListAsync(ct);
    }

    public Task DeleteAllAsync(ArtifactType type, string key, CancellationToken ct)
    {
        return _versions.DeleteManyAsync(v => v.Type == type && v.ArtifactKey == key, ct);
    }
}
