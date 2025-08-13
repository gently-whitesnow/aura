using Aura.Domain.Models;

namespace Aura.Domain.Interfaces;

public interface IArtifactVersionRepository
{
    Task<ArtifactVersion?> GetAsync(ArtifactType type, string key, int version, CancellationToken ct);
    Task InsertAsync(ArtifactVersion version, CancellationToken ct); 
    Task UpdateAsync(ArtifactVersion version, CancellationToken ct);
    Task<List<ArtifactVersion>> HistoryAsync(ArtifactType type, string key, CancellationToken ct);
    Task DeleteAllAsync(ArtifactType type, string key, CancellationToken ct);
}