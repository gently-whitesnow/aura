// Aura.Infrastructure/Repositories/MongoArtifactVersionRepository.cs
using Aura.Domain.Interfaces;
using Aura.Domain.Models;
using Aura.Infrastructure.Mappers;
using Aura.Infrastructure.Models;
using MongoDB.Driver;

namespace Aura.Infrastructure;

public sealed class ArtifactVersionMongoClient(MongoCollectionsProvider store) : IArtifactVersionRepository
{
	private readonly IMongoCollection<ArtifactVersionDbModel> _versions = store.Versions;

	public async Task<ArtifactVersion?> GetAsync(ArtifactType type, string key, int version, CancellationToken ct)
	{
		var db = await _versions
			.Find(v => v.Type == type && v.ArtifactKey == key && v.Version == version)
			.FirstOrDefaultAsync(ct);
		return db?.ToDomain();
	}

	public async Task InsertAsync(ArtifactVersion version, CancellationToken ct)
	{
		await _versions.InsertOneAsync(version.ToDb(), cancellationToken: ct);
	}

    public async Task UpdateAsync(ArtifactVersion version, CancellationToken ct)
	{
        await _versions.ReplaceOneAsync(
            v => v.Type == version.Type && v.ArtifactKey == version.ArtifactKey && v.Version == version.Version,
            version.ToDb(), cancellationToken: ct);
	}

	public async Task<List<ArtifactVersion>> HistoryAsync(ArtifactType type, string key, CancellationToken ct)
	{
		var list = await _versions
			.Find(v => v.Type == type && v.ArtifactKey == key)
			.SortByDescending(v => v.CreatedAt)
			.ToListAsync(ct);
		return list.ConvertAll(v => v.ToDomain());
	}

	public Task DeleteAllAsync(ArtifactType type, string key, CancellationToken ct)
	{
		return _versions.DeleteManyAsync(v => v.Type == type && v.ArtifactKey == key, ct);
	}
}
