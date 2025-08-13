using Aura.Domain.Interfaces;
using Aura.Domain.Models;
using MongoDB.Driver;

namespace Aura.Infrastructure;

public sealed class AdminMongoClient : IAdminRepository
{
    private readonly IMongoCollection<Admin> _admins;

    public AdminMongoClient(MongoStore store)
    {
        _admins = store.Admins;
    }

    public async Task<bool> IsAdminAsync(string login, CancellationToken ct)
    {
        return await _admins
            .Find(a => a.Login == login)
            .Limit(1)
            .AnyAsync(ct);
    }
}
