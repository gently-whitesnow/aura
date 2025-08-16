using OpenMcp.Domain.Resources.Models;

namespace OpenMcp.Domain.Interfaces;

public interface IResourceRepository
{
    Task<ResourceRecord?> GetActualAsync(string name, CancellationToken ct);
    Task<List<ResourceRecord>> ListActualAsync(string? query, CancellationToken ct);
    Task<ResourceRecord?> GetLatestAsync(string name, CancellationToken ct);
    Task<ResourceRecord?> GetLatestApprovedAsync(string name, CancellationToken ct);
    Task<ResourceRecord?> GetAsync(string name, int version, CancellationToken ct);
    Task<List<ResourceRecord>> HistoryAsync(string name, CancellationToken ct);
    Task<List<ResourceRecord>> ListLatestApprovedAsync(string? query, CancellationToken ct);
    Task InsertAsync(ResourceRecord record, CancellationToken ct);
    Task ApproveAsync(string name, int version, string approvedBy, DateTime approvedAt, CancellationToken ct);
    Task UpdateStatusAsync(string name, int version, Models.VersionStatus status, string? adminLogin, DateTime? now, CancellationToken ct);
    Task DeleteAllAsync(string name, CancellationToken ct);
}


