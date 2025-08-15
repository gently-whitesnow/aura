namespace OpenMcp.Domain.Prompts.Models;

public sealed class PromptMessageRecord
{
    public string Role { get; set; } = "user"; // "user" | "assistant"
    public string Text { get; set; } = string.Empty;
}