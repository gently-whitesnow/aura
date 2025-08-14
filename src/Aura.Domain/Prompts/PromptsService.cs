using Aura.Domain.Interfaces;
using Aura.Domain.Models;
using Aura.Domain.Prompts.Models;

namespace Aura.Domain.Prompts;

public sealed class PromptsService
{
    private readonly IPromptRepository _prompts;
    private readonly IAdminRepository _admins;

    public PromptsService(IPromptRepository prompts, IAdminRepository admins)
    {
        _prompts = prompts;
        _admins = admins;
    }

    public async Task<PromptRecord> CreatePendingAsync(
        string name,
        string? title,
        IList<PromptMessageRecord> messages,
        IList<PromptArgumentRecord>? arguments,
        string createdBy,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("name is required", nameof(name));
        if (messages == null || messages.Count == 0) throw new ArgumentException("messages are required", nameof(messages));

        var normalized = Validation.NormalizeKey(name);
        var latest = await _prompts.GetLatestAsync(normalized, ct);
        var version = Validation.NextPatch(latest?.Version);
        var now = DateTime.UtcNow;

        var record = new PromptRecord
        {
            Name = normalized,
            Version = version,
            Status = VersionStatus.Pending,
            Title = title,
            Messages = messages,
            Arguments = arguments,
            CreatedAt = now,
            CreatedBy = createdBy
        };

        await _prompts.InsertAsync(record, ct);
        return record;
    }

    public async Task ApproveAsync(string name, int version, string adminLogin, CancellationToken ct)
    {
        if (!await _admins.IsAdminAsync(adminLogin, ct))
            throw new UnauthorizedAccessException("NOT_ADMIN");

        await _prompts.ApproveAsync(Validation.NormalizeKey(name), version, adminLogin, DateTime.UtcNow, ct);
    }

    public Task<PromptRecord?> GetActiveAsync(string name, CancellationToken ct)
    {
        return _prompts.GetLatestApprovedAsync(Validation.NormalizeKey(name), ct);
    }

    public Task<List<PromptRecord>> HistoryAsync(string name, CancellationToken ct)
    {
        return _prompts.HistoryAsync(Validation.NormalizeKey(name), ct);
    }

    public Task<List<PromptRecord>> ListAsync(string? query, CancellationToken ct)
    {
        return _prompts.ListLatestApprovedAsync(query, ct);
    }

    public async Task DeleteAsync(string name, string adminLogin, CancellationToken ct)
    {
        if (!await _admins.IsAdminAsync(adminLogin, ct))
            throw new UnauthorizedAccessException("NOT_ADMIN");

        await _prompts.DeleteAllAsync(Validation.NormalizeKey(name), ct);
    }
}


