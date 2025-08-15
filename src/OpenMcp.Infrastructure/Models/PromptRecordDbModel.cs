using OpenMcp.Domain.Models;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace OpenMcp.Infrastructure.Models;

public sealed class PromptRecordDbModel
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = default!;

    public string Name { get; set; } = default!;
    public int Version { get; set; }
    public VersionStatus Status { get; set; } = VersionStatus.Pending;

    public string? Title { get; set; }
    public List<PromptMessageDbModel> Messages { get; set; } = new();
    public List<PromptArgumentDbModel>? Arguments { get; set; }

    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = default!;
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovedBy { get; set; }
}

public sealed class PromptMessageDbModel
{
    public string Role { get; set; } = "user";
    public string Text { get; set; } = string.Empty;
}

public sealed class PromptArgumentDbModel
{
    public string Name { get; set; } = default!;
    public string? Title { get; set; }
    public string? Description { get; set; }
    public bool? Required { get; set; }
}


