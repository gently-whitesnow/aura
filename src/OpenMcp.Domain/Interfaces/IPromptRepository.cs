using OpenMcp.Domain.Prompts.Models;

namespace OpenMcp.Domain.Interfaces;

public interface IPromptRepository
{
    Task<PromptRecord?> GetActualAsync(string name, CancellationToken ct);
    Task<List<PromptRecord>> ListActualAsync(string? query, CancellationToken ct);
    Task<PromptRecord?> GetLatestAsync(string name, CancellationToken ct);
    Task<PromptRecord?> GetLatestApprovedAsync(string name, CancellationToken ct);
    Task<PromptRecord?> GetAsync(string name, int version, CancellationToken ct);
    Task<List<PromptRecord>> HistoryAsync(string name, CancellationToken ct);
    Task<List<PromptRecord>> ListLatestApprovedAsync(string? query, CancellationToken ct);
    Task InsertAsync(PromptRecord record, CancellationToken ct);
    Task ApproveAsync(string name, int version, string approvedBy, DateTime approvedAt, CancellationToken ct);
    Task DeleteAllAsync(string name, CancellationToken ct);
}


