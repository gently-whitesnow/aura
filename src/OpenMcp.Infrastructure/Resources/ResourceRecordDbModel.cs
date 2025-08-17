using OpenMcp.Domain.Models;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using OpenMcp.Domain.Resources.Models;
using OpenMcp.Infrastructure.Primitives;

namespace OpenMcp.Infrastructure.Resources;

public sealed class ResourceRecordDbModel : IPrimitiveDbModel<ResourceRecord>
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = default!;

    public string Name { get; set; } = default!;
    public int Version { get; set; }
    public VersionStatus Status { get; set; } = VersionStatus.Pending;

    public string Title { get; set; } = default!;
    public string? Uri { get; set; }
    public string? Text { get; set; }
    public string? Description { get; set; }
    public string? MimeType { get; set; }
    public AnnotationsDbModel? Annotations { get; set; }
    public long? Size { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public string CreatedBy { get; set; } = default!;
    public DateTimeOffset? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    public ResourceRecord ToDomain()
    {
        return new ResourceRecord
        {
            Name = Name,
            Version = Version,
            Status = Status,
            Title = Title,
            Uri = Uri,
            Text = Text,
            Description = Description,
            MimeType = MimeType,
            Annotations = Annotations?.ToDomain(),
            Size = Size,
            CreatedAt = CreatedAt,
            CreatedBy = CreatedBy,
            UpdatedAt = UpdatedAt,
            UpdatedBy = UpdatedBy
        };
    }

    static IPrimitiveDbModel<ResourceRecord> IPrimitiveDbModel<ResourceRecord>.ToDb(ResourceRecord primitive)
    {
        return new ResourceRecordDbModel
        {
            Name = primitive.Name,
            Version = primitive.Version,
            Status = primitive.Status,
            Title = primitive.Title,
            Uri = primitive.Uri,
            Text = primitive.Text,
            Description = primitive.Description,
            MimeType = primitive.MimeType,
            Annotations = AnnotationsDbModel.ToDb(primitive.Annotations),
            Size = primitive.Size,
            CreatedAt = primitive.CreatedAt,
            CreatedBy = primitive.CreatedBy,
            UpdatedAt = primitive.UpdatedAt,
            UpdatedBy = primitive.UpdatedBy
        };
    }
}

public sealed class AnnotationsDbModel
{
    public IList<string>? Audience { get; set; }
    public float? Priority { get; set; }
    public DateTimeOffset? LastModified { get; set; }

    public AnnotationsRecord ToDomain()
    {
        return new AnnotationsRecord
        {
            Audience = Audience,
            Priority = Priority,
            LastModified = LastModified
        };
    }

    public static AnnotationsDbModel? ToDb(AnnotationsRecord? record)
    {
        if (record == null) return null;

        return new AnnotationsDbModel
        {
            Audience = record.Audience,
            Priority = record.Priority,
            LastModified = record.LastModified
        };
    }
}


