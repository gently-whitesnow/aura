namespace Aura.Server;

public static class HttpContextExtensions
{
    private static readonly string? LoginHeader = Environment.GetEnvironmentVariable("LOGIN_HEADER");

    public static string? GetLogin(HttpContext ctx)
    {
        if (LoginHeader is null) return "admin";
        var login = ctx.Request.Headers[LoginHeader].ToString();
        if (string.IsNullOrWhiteSpace(login)) return null;
        return login;
    }
}