using OpenMcp.Domain.Admins;

namespace OpenMcp.Infrastructure.Admins;

public sealed class DefaultAdminRepository : IAdminRepository
{
    public Task<bool> IsAdminAsync(string login, CancellationToken ct)
    {
        return Task.FromResult(true);
    }
}