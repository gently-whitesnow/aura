namespace OpenMcp.Domain.Prompts.Models;

public sealed class PromptResourceLinkBlock : PromptContentBlock
{
    public PromptResourceLinkBlock() => Type = "resource_link";
    public required string InternalName { get; init; }
}