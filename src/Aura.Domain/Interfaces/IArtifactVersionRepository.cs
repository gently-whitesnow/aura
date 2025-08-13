namespace Aura.Domain.Interfaces;

public interface IArtifactVersionRepository
{
    Task<ArtifactVersion?> GetAsync(ArtifactType type, string key, int version, CancellationToken ct);
    Task InsertAsync(ArtifactVersion version, CancellationToken ct); // immutable
    Task<List<ArtifactVersion>> HistoryAsync(ArtifactType type, string key, CancellationToken ct);
}