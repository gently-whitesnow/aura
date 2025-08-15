using OpenMcp.Domain.Models;
namespace OpenMcp.Domain.Prompts.Models;

public sealed class PromptRecord
{
    public string Name { get; set; } = default!; // unique key for prompt family
    public int Version { get; set; }
    public VersionStatus Status { get; set; } = VersionStatus.Pending;

    // Content
    public string? Title { get; set; }
    public IList<PromptMessageRecord> Messages { get; set; } = new List<PromptMessageRecord>();
    public IList<PromptArgumentRecord>? Arguments { get; set; }

    // Audit
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = default!;
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovedBy { get; set; }
}


