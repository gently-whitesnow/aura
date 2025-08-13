// Aura.Domain/ArtifactUseCases.cs
using Aura.Domain.Interfaces;
using Aura.Domain.Models;

namespace Aura.Domain;

public sealed class ArtifactService
{
    private readonly IArtifactRepository _artifacts;
    private readonly IArtifactVersionRepository _versions;
    private readonly IAdminRepository _admins;

    public ArtifactService(IArtifactRepository a, IArtifactVersionRepository v, IAdminRepository admins)
    { _artifacts = a; _versions = v; _admins = admins; }

    public async Task<ArtifactVersion> CreatePendingVersionAsync(
        ArtifactType type, string rawKey,
        string title, string? body, string? template, string[]? placeholders,
        string login, CancellationToken ct)
    {
        var key = Validation.NormalizeKey(rawKey);
        Validation.ValidateContent(type, body, template, placeholders);

        var now = DateTime.UtcNow;
        var art = await _artifacts.GetAsync(type, key, ct);
        if (art is null)
        {
            art = new Artifact
            {
                Type = type, Key = key, Title = title,
                CreatedAt = now, CreatedBy = login, UpdatedAt = now, UpdatedBy = login
            };
            await _artifacts.UpsertAsync(art, ct);
        }

        var version = Validation.NextPatch(art.ActiveVersion);
        var v = new ArtifactVersion
        {
            Type = type, ArtifactKey = key, Version = version, Status = VersionStatus.Pending,
            Title = title, Body = body, Template = template, Placeholders = placeholders,
            CreatedAt = now, CreatedBy = login
        };
        await _versions.InsertAsync(v, ct);
        return v;
    }

    public async Task ApproveAsync(ArtifactType type, string rawKey, int version, string adminLogin, CancellationToken ct)
    {
        if (!await _admins.IsAdminAsync(adminLogin, ct))
            throw new UnauthorizedAccessException("NOT_ADMIN");

        var key = Validation.NormalizeKey(rawKey);
        var v = await _versions.GetAsync(type, key, version, ct) ?? throw new InvalidOperationException("VERSION_NOT_FOUND");
        if (v.Status == VersionStatus.Approved) return;

        v.Status = VersionStatus.Approved;
        v.ApprovedAt = DateTime.UtcNow;
        v.ApprovedBy = adminLogin;

        await _versions.UpdateAsync(v, ct);

        await _artifacts.SetActiveVersionAsync(type, key, version, adminLogin, DateTime.UtcNow, ct);
    }

    public async Task<ArtifactVersion?> GetActiveAsync(
        ArtifactType type, string rawKey, CancellationToken ct)
    {
        var key = Validation.NormalizeKey(rawKey);
        var art = await _artifacts.GetAsync(type, key, ct);
        if (art is null || art.ActiveVersion is null) return null;

        var v = await _versions.GetAsync(type, key, art.ActiveVersion.Value, ct);
        if (v is null || v.Status != VersionStatus.Approved) return null;

        return v;
    }

    public Task<List<Artifact>> ListAsync(ArtifactType type, string? q, CancellationToken ct)
        => _artifacts.ListAsync(type, q, ct);

    public Task<List<ArtifactVersion>> HistoryAsync(ArtifactType type, string rawKey, CancellationToken ct)
        => _versions.HistoryAsync(type, Validation.NormalizeKey(rawKey), ct);
}