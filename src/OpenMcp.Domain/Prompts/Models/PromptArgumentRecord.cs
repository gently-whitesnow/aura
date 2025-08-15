namespace OpenMcp.Domain.Prompts.Models;

public sealed class PromptArgumentRecord
{
    public string Name { get; set; } = default!;
    public string? Title { get; set; }
    public string? Description { get; set; }
    public bool? Required { get; set; }
}