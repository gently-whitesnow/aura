namespace OpenMcp.Domain.Interfaces;

public interface IAdminRepository
{
    Task<bool> IsAdminAsync(string login, CancellationToken ct);
}