using System.Text.Json;
using System.Text.RegularExpressions;

namespace OpenMcp.Domain.Prompts;

public static class PromptTextFormatter
{
    private static readonly Regex PlaceholderRegex = new(@"\{\{(\w+)\}\}", RegexOptions.Compiled);

    public static string ApplyArguments(string template, IReadOnlyDictionary<string, JsonElement>? arguments)
    {
        if (arguments == null || arguments.Count == 0)
            return template;

        return PlaceholderRegex.Replace(template, match =>
        {
            var key = match.Groups[1].Value;
            if (arguments.TryGetValue(key, out var value))
            {
                return value.ValueKind == JsonValueKind.String
                    ? value.GetString() ?? string.Empty
                    : value.ToString();
            }
            return match.Value; // оставляем {{var}} если аргумент не найден
        });
    }
}