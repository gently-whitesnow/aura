using Aura.Domain.Models;

namespace Aura.Domain.Interfaces;

public interface IArtifactRepository
{
    Task<Artifact?> GetAsync(ArtifactType type, string key, CancellationToken ct);
    Task UpsertAsync(Artifact artifact, CancellationToken ct);
    Task SetActiveVersionAsync(ArtifactType type, string key, int version, string updatedBy, DateTime now, CancellationToken ct);
    Task<List<Artifact>> ListAsync(ArtifactType type, string? query, CancellationToken ct);
    Task DeleteAsync(ArtifactType type, string key, CancellationToken ct);
}