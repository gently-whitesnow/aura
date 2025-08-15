using OpenMcp.Domain.Interfaces;
using OpenMcp.Domain.Models;
using OpenMcp.Infrastructure.Mappers;
using OpenMcp.Infrastructure.Models;
using OpenMcp.Infrastructure.MongoClients;
using MongoDB.Driver;

namespace OpenMcp.Infrastructure;

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
