namespace OpenMcp.Domain.Prompts.Models;

public sealed class PromptMessageRecord
{
    public string Role { get; set; } = "user"; // "user" | "assistant"
    public PromptContentBlock Content { get; set; } = new PromptTextContentBlock { Text = string.Empty };
}