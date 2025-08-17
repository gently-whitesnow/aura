using OpenMcp.Infrastructure.Models;
using MongoDB.Driver;
using OpenMcp.Infrastructure.Mongo;
using OpenMcp.Domain.Admins;

namespace OpenMcp.Infrastructure;

public sealed class AdminMongoClient(MongoCollectionsProvider store) : IAdminRepository
{
    private readonly IMongoCollection<AdminDbModel> _admins = store.Admins;

    public async Task<bool> IsAdminAsync(string login, CancellationToken ct)
    {
        return await _admins
            .Find(a => a.Login == login)
            .Limit(1)
            .AnyAsync(ct);
    }
}
