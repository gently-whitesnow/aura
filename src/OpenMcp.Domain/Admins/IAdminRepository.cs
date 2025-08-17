namespace OpenMcp.Domain.Admins;

public interface IAdminRepository
{
    Task<bool> IsAdminAsync(string login, CancellationToken ct);
}