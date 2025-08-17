using OpenMcp.Domain.Models;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using OpenMcp.Domain.Prompts.Models;
using OpenMcp.Infrastructure.Primitives;

namespace OpenMcp.Infrastructure.Prompts;

public sealed class PromptRecordDbModel : IPrimitiveDbModel<PromptRecord>
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = default!;

    public string Name { get; set; } = default!;
    public int Version { get; set; }
    public VersionStatus Status { get; set; } = VersionStatus.Pending;

    public string Title { get; set; } = default!;
    public List<PromptMessageDbModel> Messages { get; set; } = new();
    public List<PromptArgumentDbModel>? Arguments { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public string CreatedBy { get; set; } = default!;
    public DateTimeOffset? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    public PromptRecord ToDomain()
    {
        return new PromptRecord
        {
            Name = Name,
            Version = Version,
            Status = Status,
            Title = Title,
            Messages = Messages.Select(m => new PromptMessageRecord { Role = m.Role, Text = m.Text }).ToList(),
            Arguments = Arguments?.Select(a => new PromptArgumentRecord { Name = a.Name, Title = a.Title, Description = a.Description, Required = a.Required }).ToList(),
            CreatedAt = CreatedAt,
            CreatedBy = CreatedBy,
            UpdatedAt = UpdatedAt,
            UpdatedBy = UpdatedBy
        };
    }

    static IPrimitiveDbModel<PromptRecord> IPrimitiveDbModel<PromptRecord>.ToDb(PromptRecord primitive)
    {
        return new PromptRecordDbModel
        {
            Name = primitive.Name,
            Version = primitive.Version,
            Status = primitive.Status,
            Title = primitive.Title,
            Messages = primitive.Messages.Select(m => new PromptMessageDbModel { Role = m.Role, Text = m.Text }).ToList(),
            Arguments = primitive.Arguments?.Select(a => new PromptArgumentDbModel { Name = a.Name, Title = a.Title, Description = a.Description, Required = a.Required }).ToList(),
            CreatedAt = primitive.CreatedAt,
            CreatedBy = primitive.CreatedBy,
            UpdatedAt = primitive.UpdatedAt,
            UpdatedBy = primitive.UpdatedBy
        };
    }
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