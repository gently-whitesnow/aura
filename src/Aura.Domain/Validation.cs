using System.Text.RegularExpressions;

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

    public static int NextPatch(int? current)
    {
        if (current == null) return 1;
        return current.Value + 1;
    }
}


