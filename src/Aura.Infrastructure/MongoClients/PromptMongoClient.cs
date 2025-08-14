using Aura.Domain.Interfaces;
using Aura.Domain.Prompts.Models;
using Aura.Infrastructure.Mappers;
using Aura.Infrastructure.Models;
using MongoDB.Driver;
using MongoDB.Bson;
using System.Text.RegularExpressions;
using Aura.Infrastructure.MongoClients;

namespace Aura.Infrastructure;

public sealed class PromptMongoClient : IPromptRepository
{
    private readonly IMongoCollection<PromptRecordDbModel> _prompts;

    public PromptMongoClient(MongoCollectionsProvider store)
    {
        _prompts = store.Prompts;
    }

    public async Task<PromptRecord?> GetLatestApprovedAsync(string name, CancellationToken ct)
    {
        var db = await _prompts
            .Find(p => p.Name == name && p.Status == Aura.Domain.Models.VersionStatus.Approved)
            .SortByDescending(p => p.Version)
            .FirstOrDefaultAsync(ct);
        return db?.ToDomain();
    }

    public async Task<PromptRecord?> GetLatestAsync(string name, CancellationToken ct)
    {
        var db = await _prompts
            .Find(p => p.Name == name)
            .SortByDescending(p => p.Version)
            .FirstOrDefaultAsync(ct);
        return db?.ToDomain();
    }

    public async Task<PromptRecord?> GetAsync(string name, int version, CancellationToken ct)
    {
        var db = await _prompts
            .Find(p => p.Name == name && p.Version == version)
            .FirstOrDefaultAsync(ct);
        return db?.ToDomain();
    }

    public async Task<List<PromptRecord>> HistoryAsync(string name, CancellationToken ct)
    {
        var list = await _prompts
            .Find(p => p.Name == name)
            .SortByDescending(p => p.CreatedAt)
            .ToListAsync(ct);
        return list.ConvertAll(p => p.ToDomain());
    }

    public async Task<List<PromptRecord>> ListLatestApprovedAsync(string? query, CancellationToken ct)
    {
        var filter = Builders<PromptRecordDbModel>.Filter.Eq(p => p.Status, Aura.Domain.Models.VersionStatus.Approved);
        if (!string.IsNullOrWhiteSpace(query))
        {
            var rx = new BsonRegularExpression(new Regex(Regex.Escape(query), RegexOptions.IgnoreCase));
            filter &= Builders<PromptRecordDbModel>.Filter.Regex(p => p.Title, rx);
        }

        // Sort by name asc, version desc, take first per name in memory
        var all = await _prompts
            .Find(filter)
            .SortBy(p => p.Name).ThenByDescending(p => p.Version)
            .ToListAsync(ct);

        var result = new List<PromptRecord>();
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

    public Task InsertAsync(PromptRecord record, CancellationToken ct)
    {
        return _prompts.InsertOneAsync(record.ToDb(), cancellationToken: ct);
    }

    public async Task ApproveAsync(string name, int version, string approvedBy, DateTime approvedAt, CancellationToken ct)
    {
        var filter = Builders<PromptRecordDbModel>.Filter.Where(p => p.Name == name && p.Version == version);
        var update = Builders<PromptRecordDbModel>.Update
            .Set(p => p.Status, Aura.Domain.Models.VersionStatus.Approved)
            .Set(p => p.ApprovedAt, approvedAt)
            .Set(p => p.ApprovedBy, approvedBy);

        var res = await _prompts.UpdateOneAsync(filter, update, cancellationToken: ct);
        if (res.MatchedCount == 0)
            throw new InvalidOperationException("PROMPT_VERSION_NOT_FOUND");
    }

    public Task DeleteAllAsync(string name, CancellationToken ct)
    {
        return _prompts.DeleteManyAsync(p => p.Name == name, ct);
    }
}


