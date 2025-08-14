using Aura.Domain.Resources.Models;
using Aura.Infrastructure.Models;

namespace Aura.Infrastructure.Mappers;

public static class ResourceRecordMapper
{
    public static ResourceRecordDbModel ToDb(this ResourceRecord model)
    {
        return new ResourceRecordDbModel
        {
            Name = model.Name,
            Version = model.Version,
            Status = model.Status,
            Title = model.Title,
            Uri = model.Uri,
            Text = model.Text,
            Description = model.Description,
            MimeType = model.MimeType,
            Annotations = model.Annotations is null ? null : new AnnotationsDbModel
            {
                Audience = model.Annotations.Audience,
                Priority = model.Annotations.Priority,
                LastModified = model.Annotations.LastModified
            },
            Size = model.Size,
            CreatedAt = model.CreatedAt,
            CreatedBy = model.CreatedBy,
            ApprovedAt = model.ApprovedAt,
            ApprovedBy = model.ApprovedBy
        };
    }

    public static ResourceRecord ToDomain(this ResourceRecordDbModel db)
    {
        return new ResourceRecord
        {
            Name = db.Name,
            Version = db.Version,
            Status = db.Status,
            Title = db.Title,
            Uri = db.Uri,
            Text = db.Text,
            Description = db.Description,
            MimeType = db.MimeType,
            Annotations = db.Annotations is null ? null : new AnnotationsRecord
            {
                Audience = db.Annotations.Audience,
                Priority = db.Annotations.Priority,
                LastModified = db.Annotations.LastModified
            },
            Size = db.Size,
            CreatedAt = db.CreatedAt,
            CreatedBy = db.CreatedBy,
            ApprovedAt = db.ApprovedAt,
            ApprovedBy = db.ApprovedBy
        };
    }
}


