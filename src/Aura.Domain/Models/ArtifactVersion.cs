namespace Aura.Domain.Models;
public sealed class ArtifactVersion
{
    public string Id { get; set; } = default!;
    public ArtifactType Type { get; set; }
    public string ArtifactKey { get; set; } = default!; // lc
    public int Version { get; set; } = default!;     // 1-2-3-
    public VersionStatus Status { get; set; } = VersionStatus.Pending;

    // Контент:
    public string Title { get; set; } = default!;
    public string? Body { get; set; }                  // для Prompt (markdown)
    public string? Template { get; set; }              // для Resource (с {{Vars}})
    public string[]? Placeholders { get; set; }        // для Resource

    // Аудит:
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = default!;
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovedBy { get; set; }
}


