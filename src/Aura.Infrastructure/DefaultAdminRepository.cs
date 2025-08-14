using Aura.Domain.Interfaces;

namespace Aura.Infrastructure;

public sealed class DefaultAdminRepository : IAdminRepository
{
    public Task<bool> IsAdminAsync(string login, CancellationToken ct)
    {
        return Task.FromResult(true);
    }
}