using Aura.Domain.Interfaces;
using Aura.Domain.Models;
using Aura.Infrastructure.Mappers;
using Aura.Infrastructure.Models;
using MongoDB.Driver;

namespace Aura.Infrastructure;

public sealed class AdminMongoClient : IAdminRepository
{
    private readonly IMongoCollection<AdminDbModel> _admins;

    public AdminMongoClient(MongoCollectionsProvider store)
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
