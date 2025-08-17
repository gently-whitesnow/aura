using MongoDB.Driver;
using MongoDB.Bson;
using System.Text.RegularExpressions;
using OpenMcp.Domain.Primitives;
using OpenMcp.Domain.Models;

namespace OpenMcp.Infrastructure.Primitives;

public abstract class PrimitivesMongoClient<TPrimitive, TPrimitiveDbModel> : IPrimitivesRepository<TPrimitive> where TPrimitive : class, IPrimitive where TPrimitiveDbModel : IPrimitiveDbModel<TPrimitive>
{
    protected abstract IMongoCollection<TPrimitiveDbModel> PrimitivesCollection { get; }

    public async Task<TPrimitive?> GetActualAsync(string name, CancellationToken ct)
    {
        var filterByName = Builders<TPrimitiveDbModel>.Filter.Eq(p => p.Name, name);

        // 1) Самая свежая approved-версия
        var approved = await PrimitivesCollection
            .Find(filterByName & Builders<TPrimitiveDbModel>.Filter.Eq(p => p.Status, VersionStatus.Approved))
            .SortByDescending(p => p.Version)
            .Limit(1)
            .FirstOrDefaultAsync(ct);

        if (approved != null) return approved.ToDomain();

        // 2) Иначе просто самая свежая версия
        var latest = await PrimitivesCollection
            .Find(filterByName)
            .SortByDescending(p => p.Version)
            .Limit(1)
            .FirstOrDefaultAsync(ct);

        return latest?.ToDomain();
    }

    public async Task<List<TPrimitive>> ListActualAsync(string? query, CancellationToken ct)
    {
        var filter = Builders<TPrimitiveDbModel>.Filter.Empty;
        if (!string.IsNullOrWhiteSpace(query))
        {
            var rx = new BsonRegularExpression(new Regex(Regex.Escape(query), RegexOptions.IgnoreCase));
            filter &= Builders<TPrimitiveDbModel>.Filter.Regex(p => p.Title, rx) | Builders<TPrimitiveDbModel>.Filter.Regex(p => p.Name, rx);
        }

        var all = await PrimitivesCollection
            .Find(filter)
            .SortBy(p => p.Name).ThenByDescending(p => p.Version)
            .ToListAsync(ct);

        var result = new List<TPrimitive>();
        TPrimitiveDbModel? relevant = default;
        foreach (var db in all)
        {
            if (relevant != null && relevant.Name != db.Name)
            {
                result.Add(relevant.ToDomain());
                relevant = db;
            }

            if (relevant == null || relevant.Status != VersionStatus.Approved && db.Status == VersionStatus.Approved)
            {
                relevant = db;
            }
        }

        if (relevant != null)
            result.Add(relevant.ToDomain());

        return result;
    }

    public async Task<TPrimitive?> GetLatestAsync(string name, CancellationToken ct)
    {
        var db = await PrimitivesCollection
            .Find(p => p.Name == name)
            .SortByDescending(p => p.Version)
            .FirstOrDefaultAsync(ct);

        if (db == null) return default;

        return db.ToDomain();
    }

    public async Task<List<TPrimitive>> HistoryAsync(string name, CancellationToken ct)
    {
        var list = await PrimitivesCollection
            .Find(p => p.Name == name)
            .SortByDescending(p => p.CreatedAt)
            .ToListAsync(ct);
        return list.ConvertAll(p => p.ToDomain());
    }

    public async Task<TPrimitive?> GetLatestApprovedAsync(string name, CancellationToken ct)
    {
        var db = await PrimitivesCollection
            .Find(p => p.Name == name && p.Status == VersionStatus.Approved)
            .SortByDescending(p => p.Version)
            .FirstOrDefaultAsync(ct);
        return db?.ToDomain();
    }

    public async Task<List<TPrimitive>> ListLatestApprovedAsync(string? query, CancellationToken ct)
    {
        var filter = Builders<TPrimitiveDbModel>.Filter.Eq(p => p.Status, VersionStatus.Approved);
        if (!string.IsNullOrWhiteSpace(query))
        {
            var rx = new BsonRegularExpression(new Regex(Regex.Escape(query), RegexOptions.IgnoreCase));
            filter &= Builders<TPrimitiveDbModel>.Filter.Regex(p => p.Title, rx) | Builders<TPrimitiveDbModel>.Filter.Regex(p => p.Name, rx);
        }

        // Sort by name asc, version desc, take first per name in memory
        var all = await PrimitivesCollection
            .Find(filter)
            .SortBy(p => p.Name).ThenByDescending(p => p.Version)
            .ToListAsync(ct);

        var result = new List<TPrimitive>();
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

    public Task InsertAsync(TPrimitive record)
    {
        var db = (TPrimitiveDbModel)TPrimitiveDbModel.ToDb(record);
        return PrimitivesCollection.InsertOneAsync(db);
    }

    public async Task UpdateStatusAsync(
        string name,
        int version,
        VersionStatus status,
        string adminLogin)
    {
        var filter = Builders<TPrimitiveDbModel>.Filter.Where(p => p.Name == name && p.Version == version);
        var update = Builders<TPrimitiveDbModel>.Update
            .Set(p => p.Status, status);

        if (status == VersionStatus.Approved)
        {
            update = update.Set(p => p.UpdatedAt, DateTimeOffset.UtcNow)
                           .Set(p => p.UpdatedBy, adminLogin);
        }
        else
        {
            update = update.Set(p => p.UpdatedAt, null)
                           .Set(p => p.UpdatedBy, null);
        }

        var res = await PrimitivesCollection.UpdateOneAsync(filter, update);
        if (res.MatchedCount == 0)
            throw new InvalidOperationException("PROMPT_VERSION_NOT_FOUND");
    }

    public Task DeleteAsync(string name, int version)
    {
        return PrimitivesCollection.DeleteOneAsync(p => p.Name == name && p.Version == version);
    }
}


