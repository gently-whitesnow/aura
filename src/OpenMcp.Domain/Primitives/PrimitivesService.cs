using OpenMcp.Domain.Admins;
using OpenMcp.Domain.Models;

namespace OpenMcp.Domain.Primitives;

public abstract class PrimitivesService<TPrimitive> where TPrimitive : IPrimitive
{
    private readonly IPrimitivesRepository<TPrimitive> _primitivesRepository;
    private readonly IAdminRepository _adminsRepository;

    public PrimitivesService(IPrimitivesRepository<TPrimitive> primitives, IAdminRepository admins)
    {
        _primitivesRepository = primitives;
        _adminsRepository = admins;
    }

    public async Task<TPrimitive> CreateAsync(
        TPrimitive primitive,
        string createdBy)
    {
        if (string.IsNullOrWhiteSpace(primitive.Name)) throw new ArgumentException("name is required", nameof(primitive.Name));

        var normalizedName = Validation.NormalizeKey(primitive.Name);
        var latest = await _primitivesRepository.GetLatestAsync(normalizedName, CancellationToken.None);
        var version = Validation.NextPatch(latest?.Version);
        var now = DateTime.UtcNow;

        primitive.Version = version;
        primitive.CreatedAt = now;
        primitive.CreatedBy = createdBy;
        primitive.Status = VersionStatus.Pending;

        await _primitivesRepository.InsertAsync(primitive);
        return primitive;
    }

    public async Task UpdateStatusAsync(string name, int version, VersionStatus status, string adminLogin)
    {
        if (!await _adminsRepository.IsAdminAsync(adminLogin, CancellationToken.None))
            throw new UnauthorizedAccessException("NOT_ADMIN");

        await _primitivesRepository.UpdateStatusAsync(Validation.NormalizeKey(name), version, status, adminLogin);
    }

    public Task<TPrimitive?> GetActualAsync(string name, CancellationToken ct)
    {
        return _primitivesRepository.GetActualAsync(Validation.NormalizeKey(name), ct);
    }

    public Task<List<TPrimitive>> ListActualAsync(string? query, CancellationToken ct)
    {
        return _primitivesRepository.ListActualAsync(query, ct);
    }

    public Task<List<TPrimitive>> HistoryAsync(string name, CancellationToken ct)
    {
        return _primitivesRepository.HistoryAsync(Validation.NormalizeKey(name), ct);
    }

    public Task<TPrimitive?> GetLatestApprovedAsync(string name, CancellationToken ct)
    {
        return _primitivesRepository.GetLatestApprovedAsync(Validation.NormalizeKey(name), ct);
    }

    public Task<List<TPrimitive>> ListLatestApprovedAsync(string? query, CancellationToken ct)
    {
        return _primitivesRepository.ListLatestApprovedAsync(query, ct);
    }

    public async Task DeleteAsync(string name, string adminLogin)
    {
        if (!await _adminsRepository.IsAdminAsync(adminLogin, CancellationToken.None))
            throw new UnauthorizedAccessException("NOT_ADMIN");

        await _primitivesRepository.DeleteAsync(Validation.NormalizeKey(name));
    }
}


