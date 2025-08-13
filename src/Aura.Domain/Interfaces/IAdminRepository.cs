namespace Aura.Domain.Interfaces;

public interface IAdminRepository
{
    Task<bool> IsAdminAsync(string login, CancellationToken ct);
}