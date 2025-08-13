// Aura.Infrastructure/Repositories/MongoArtifactVersionRepository.cs
using Aura.Domain;
using Aura.Domain.Interfaces;
using MongoDB.Driver;

namespace Aura.Infrastructure;

public sealed class ArtifactVersionMongoClient : IArtifactVersionRepository
{
    private readonly IMongoCollection<ArtifactVersion> _versions;

    public ArtifactVersionMongoClient(MongoStore store)
    {
        _versions = store.Versions;
    }

    public async Task<ArtifactVersion?> GetAsync(ArtifactType type, string key, int version, CancellationToken ct)
    {
        return await _versions
            .Find(v => v.Type == type && v.ArtifactKey == key && v.Version == version)
            .FirstOrDefaultAsync(ct);
    }

    public async Task InsertAsync(ArtifactVersion version, CancellationToken ct)
    {
        // версия immutable; уникальный индекс (type,artifactKey,version) обеспечит отсутствие дублей
        await _versions.InsertOneAsync(version, cancellationToken: ct);
    }

    public async Task<List<ArtifactVersion>> HistoryAsync(ArtifactType type, string key, CancellationToken ct)
    {
        return await _versions
            .Find(v => v.Type == type && v.ArtifactKey == key)
            .SortByDescending(v => v.Version)     // версия как int — естественная сортировка
            .ThenByDescending(v => v.CreatedAt)
            .ToListAsync(ct);
    }
}
