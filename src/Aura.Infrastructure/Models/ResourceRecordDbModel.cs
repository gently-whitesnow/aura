using Aura.Domain.Models;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Aura.Infrastructure.Models;

public sealed class ResourceRecordDbModel
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = default!;

    public string Name { get; set; } = default!;
    public int Version { get; set; }
    public VersionStatus Status { get; set; } = VersionStatus.Pending;

    public string? Title { get; set; }
    public string? Uri { get; set; }
    public string? Text { get; set; }
    public string? Description { get; set; }
    public string? MimeType { get; set; }
    public AnnotationsDbModel? Annotations { get; set; }
    public long? Size { get; set; }

    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = default!;
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovedBy { get; set; }
}

public sealed class AnnotationsDbModel
{
    public IList<string>? Audience { get; set; }
    public float? Priority { get; set; }
    public DateTimeOffset? LastModified { get; set; }
}


