using Aura.Domain.Interfaces;
using Aura.Domain.Resources.Models;
using Aura.Infrastructure.Mappers;
using Aura.Infrastructure.Models;
using MongoDB.Driver;
using MongoDB.Bson;
using System.Text.RegularExpressions;
using Aura.Infrastructure.MongoClients;

namespace Aura.Infrastructure;

public sealed class ResourceMongoClient : IResourceRepository
{
    private readonly IMongoCollection<ResourceRecordDbModel> _resources;

    public ResourceMongoClient(MongoCollectionsProvider store)
    {
        _resources = store.Resources;
    }

    public async Task<ResourceRecord?> GetLatestApprovedAsync(string name, CancellationToken ct)
    {
        var db = await _resources
            .Find(p => p.Name == name && p.Status == Aura.Domain.Models.VersionStatus.Approved)
            .SortByDescending(p => p.Version)
            .FirstOrDefaultAsync(ct);
        return db?.ToDomain();
    }

    public async Task<ResourceRecord?> GetLatestAsync(string name, CancellationToken ct)
    {
        var db = await _resources
            .Find(p => p.Name == name)
            .SortByDescending(p => p.Version)
            .FirstOrDefaultAsync(ct);
        return db?.ToDomain();
    }

    public async Task<ResourceRecord?> GetAsync(string name, int version, CancellationToken ct)
    {
        var db = await _resources
            .Find(p => p.Name == name && p.Version == version)
            .FirstOrDefaultAsync(ct);
        return db?.ToDomain();
    }

    public async Task<List<ResourceRecord>> HistoryAsync(string name, CancellationToken ct)
    {
        var list = await _resources
            .Find(p => p.Name == name)
            .SortByDescending(p => p.CreatedAt)
            .ToListAsync(ct);
        return list.ConvertAll(p => p.ToDomain());
    }

    public async Task<List<ResourceRecord>> ListLatestApprovedAsync(string? query, CancellationToken ct)
    {
        var filter = Builders<ResourceRecordDbModel>.Filter.Eq(p => p.Status, Aura.Domain.Models.VersionStatus.Approved);
        if (!string.IsNullOrWhiteSpace(query))
        {
            var rx = new BsonRegularExpression(new Regex(Regex.Escape(query), RegexOptions.IgnoreCase));
            filter &= Builders<ResourceRecordDbModel>.Filter.Regex(p => p.Title, rx);
        }

        var all = await _resources
            .Find(filter)
            .SortBy(p => p.Name).ThenByDescending(p => p.Version)
            .ToListAsync(ct);

        var result = new List<ResourceRecord>();
        string? lastName = null;
        foreach (var db in all)
        {
            if (!string.Equals(lastName, db.Name, StringComparison.Ordinal))
            {
                result.Add(db.ToDomain());
                lastName = db.Name;
            }
        }
        return result;
    }

    public Task InsertAsync(ResourceRecord record, CancellationToken ct)
    {
        return _resources.InsertOneAsync(record.ToDb(), cancellationToken: ct);
    }

    public async Task ApproveAsync(string name, int version, string approvedBy, DateTime approvedAt, CancellationToken ct)
    {
        var filter = Builders<ResourceRecordDbModel>.Filter.Where(p => p.Name == name && p.Version == version);
        var update = Builders<ResourceRecordDbModel>.Update
            .Set(p => p.Status, Aura.Domain.Models.VersionStatus.Approved)
            .Set(p => p.ApprovedAt, approvedAt)
            .Set(p => p.ApprovedBy, approvedBy);

        var res = await _resources.UpdateOneAsync(filter, update, cancellationToken: ct);
        if (res.MatchedCount == 0)
            throw new InvalidOperationException("RESOURCE_VERSION_NOT_FOUND");
    }

    public Task DeleteAllAsync(string name, CancellationToken ct)
    {
        return _resources.DeleteManyAsync(p => p.Name == name, ct);
    }
}


