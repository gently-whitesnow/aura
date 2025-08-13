using System.Text.RegularExpressions;
using Aura.Domain.Models;

namespace Aura.Domain;
public static class Validation
{
    static readonly Regex KeyRe = new(@"^[a-z0-9][a-z0-9\-\/\.]{2,200}$", RegexOptions.Compiled);

    public static string NormalizeKey(string key)
    {
        var k = key.Trim().ToLowerInvariant();
        if (!KeyRe.IsMatch(k)) throw new ArgumentException("INVALID_KEY");
        return k;
    }

    public static void ValidateContent(ArtifactType type, string? body, string? template, string[]? placeholders)
    {
        if (type == ArtifactType.Prompt)
        {
            if (string.IsNullOrWhiteSpace(body)) throw new ArgumentException("EMPTY_BODY");
        }
        else
        {
            if (string.IsNullOrWhiteSpace(template)) throw new ArgumentException("EMPTY_TEMPLATE");
            var found = ExtractPlaceholders(template!);
            var given = placeholders ?? Array.Empty<string>();
            if (found.Count != given.Length || !found.SetEquals(given))
                throw new ArgumentException("PLACEHOLDERS_MISMATCH");
        }
    }

    static HashSet<string> ExtractPlaceholders(string t)
    {
        var m = Regex.Matches(t, "{{\\s*([A-Za-z0-9_]+)\\s*}}");
        return m.Select(x => x.Groups[1].Value).ToHashSet(StringComparer.Ordinal);
    }

    public static int NextPatch(int? current)
    {
        if (current == null) return 1;
        return current.Value + 1;
    }
}


