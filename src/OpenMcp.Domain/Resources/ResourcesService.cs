using System.Text;
using OpenMcp.Domain.Interfaces;
using OpenMcp.Domain.Models;
using OpenMcp.Domain.Resources.Models;

namespace OpenMcp.Domain.Resources;

public sealed class ResourcesService
{
    private readonly IResourceRepository _resources;
    private readonly IAdminRepository _admins;
    private readonly IResourceChangeNotifier _changeNotifier;

    public ResourcesService(IResourceRepository resources, IAdminRepository admins, IResourceChangeNotifier changeNotifier)
    {
        _resources = resources;
        _admins = admins;
        _changeNotifier = changeNotifier;
    }

    public async Task<ResourceRecord> CreatePendingAsync(
        string name,
        string? title,
        string? uri,
        string? text,
        string? description,
        string? mimeType,
        AnnotationsRecord? annotations,
        string createdBy,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("name is required", nameof(name));

        var normalized = Validation.NormalizeKey(name);
        var latest = await _resources.GetLatestAsync(normalized, ct);
        var version = Validation.NextPatch(latest?.Version);
        var now = DateTime.UtcNow;

        long? size = null;
        if (!string.IsNullOrEmpty(text))
            size = Encoding.UTF8.GetByteCount(text);

        var record = new ResourceRecord
        {
            Name = normalized,
            Version = version,
            Status = VersionStatus.Pending,
            Title = title,
            Uri = uri,
            Text = text,
            Description = description,
            MimeType = mimeType,
            Annotations = annotations,
            Size = size,
            CreatedAt = now,
            CreatedBy = createdBy
        };

        await _resources.InsertAsync(record, ct);
        return record;
    }

    public async Task ApproveAsync(string name, int version, string adminLogin, CancellationToken ct)
    {
        if (!await _admins.IsAdminAsync(adminLogin, ct))
            throw new UnauthorizedAccessException("NOT_ADMIN");

        var normalized = Validation.NormalizeKey(name);
        await _resources.ApproveAsync(normalized, version, adminLogin, DateTime.UtcNow, ct);

        var uri = $"open-mcp://resource/{normalized}";
        await _changeNotifier.NotifyUpdatedAsync(uri, ct);
    }

    public async Task UpdateStatusAsync(string name, int version, VersionStatus status, string adminLogin, CancellationToken ct)
    {
        if (!await _admins.IsAdminAsync(adminLogin, ct))
            throw new UnauthorizedAccessException("NOT_ADMIN");

        var normalized = Validation.NormalizeKey(name);
        await _resources.UpdateStatusAsync(normalized, version, status, adminLogin, DateTime.UtcNow, ct);

        var uri = $"open-mcp://resource/{normalized}";
        await _changeNotifier.NotifyUpdatedAsync(uri, ct);
    }

    public Task<ResourceRecord?> GetActualAsync(string name, CancellationToken ct)
    {
        return _resources.GetActualAsync(Validation.NormalizeKey(name), ct);
    }

    public Task<List<ResourceRecord>> ListActualAsync(string? query, CancellationToken ct)
    {
        return _resources.ListActualAsync(query, ct);
    }

    public Task<ResourceRecord?> GetLatestApprovedAsync(string name, CancellationToken ct)
    {
        return _resources.GetLatestApprovedAsync(Validation.NormalizeKey(name), ct);
    }

    public Task<List<ResourceRecord>> HistoryAsync(string name, CancellationToken ct)
    {
        return _resources.HistoryAsync(Validation.NormalizeKey(name), ct);
    }

    public Task<List<ResourceRecord>> ListLatestApprovedAsync(string? query, CancellationToken ct)
    {
        return _resources.ListLatestApprovedAsync(query, ct);
    }

    public async Task DeleteAsync(string name, string adminLogin, CancellationToken ct)
    {
        if (!await _admins.IsAdminAsync(adminLogin, ct))
            throw new UnauthorizedAccessException("NOT_ADMIN");

        var normalized = Validation.NormalizeKey(name);
        await _resources.DeleteAllAsync(normalized, ct);

        var uri = $"open-mcp://resource/{normalized}";
        await _changeNotifier.NotifyUpdatedAsync(uri, ct);
    }
}


