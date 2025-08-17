using OpenMcp.Domain.Models;
using OpenMcp.Domain.Primitives;
namespace OpenMcp.Domain.Prompts.Models;

public sealed class PromptRecord : IPrimitive
{
    public string Name { get; set; } = default!; // unique key for prompt family
    public int Version { get; set; }
    public VersionStatus Status { get; set; } = VersionStatus.Pending;

    // Content
    public string Title { get; set; } = default!;
    public IList<PromptMessageRecord> Messages { get; set; } = new List<PromptMessageRecord>();
    public IList<PromptArgumentRecord>? Arguments { get; set; }

    // Audit
    public DateTimeOffset CreatedAt { get; set; }
    public string CreatedBy { get; set; } = default!;
    public DateTimeOffset? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}


