namespace OpenMcp.Domain.Prompts.Models;

public sealed class PromptTextContentBlock : PromptContentBlock
{
    public PromptTextContentBlock() => Type = "text";
    public string Text { get; set; } = string.Empty;
}