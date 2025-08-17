using OpenMcp.Domain.Models;

namespace OpenMcp.Domain.Primitives;

public interface IPrimitivesRepository<TPrimitive> where TPrimitive : IPrimitive
{
    Task InsertAsync(TPrimitive primitive);
    Task UpdateStatusAsync(string name, int version, VersionStatus status, string adminLogin);
    Task<TPrimitive?> GetActualAsync(string name, CancellationToken ct);
    Task<List<TPrimitive>> ListActualAsync(string? query, CancellationToken ct);
    Task<TPrimitive?> GetLatestAsync(string name, CancellationToken ct);
    Task<List<TPrimitive>> HistoryAsync(string name, CancellationToken ct);
    Task DeleteAsync(string name, int version);

    // mcp-specific
    Task<List<TPrimitive>> ListLatestApprovedAsync(string? query, CancellationToken ct);
    Task<TPrimitive?> GetLatestApprovedAsync(string name, CancellationToken ct);
}