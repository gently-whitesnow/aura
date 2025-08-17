using OpenMcp.Domain.Models;

namespace OpenMcp.Domain.Primitives;

public interface IPrimitive
{
    string Name { get; set; }
    string Title { get; set; }
    int Version { get; set;}
    DateTimeOffset CreatedAt { get; set; }
    string CreatedBy { get; set; }
    VersionStatus Status { get; set; }
    DateTimeOffset? UpdatedAt { get; set; }
    string? UpdatedBy { get; set; }
}