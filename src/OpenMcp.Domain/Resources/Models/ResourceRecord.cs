using OpenMcp.Domain.Models;
using OpenMcp.Domain.Primitives;

namespace OpenMcp.Domain.Resources.Models;

public sealed class ResourceRecord : IPrimitive
{
    public string Name { get; set; } = default!;
    public int Version { get; set; }
    public VersionStatus Status { get; set; } = VersionStatus.Pending;

    public string Title { get; set; } = default!;

    // Пока никуда не отправляем агента, так как нет авторизации
    public string? Uri { get; set; }
    public string? Text { get; set; }
    public string? Description { get; set; }

    // Для начала поддерживаем только текст
    public string? MimeType { get; set; }
    public AnnotationsRecord? Annotations { get; set; }
    public long? Size { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public string CreatedBy { get; set; } = default!;
    public DateTimeOffset? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

public sealed class AnnotationsRecord
{
    public IList<string>? Audience { get; set; }
    public float? Priority { get; set; }
    public DateTimeOffset? LastModified { get; set; }
}


