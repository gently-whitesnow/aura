namespace Aura.Domain.Models;

public sealed class Artifact
{
    public ArtifactType Type { get; set; }
    public string Key { get; set; } = default!;       // lc, формат: ^[a-z0-9][a-z0-9\-\/\.]{2,200}$
    public string Title { get; set; } = default!;
    public int? ActiveVersion { get; set; }        // 1-2-3-
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = default!;
    public DateTime UpdatedAt { get; set; }
    public string UpdatedBy { get; set; } = default!;
}


