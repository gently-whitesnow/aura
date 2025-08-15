using OpenMcp.Domain.Interfaces;

namespace OpenMcp.Server.Api
{
    public static class UsersApi
    {
        public static void MapUsersApi(this WebApplication app)
        {
            // информация о текущем пользователе
            app.MapGet("v1/user", async (HttpContext ctx, IAdminRepository admins, CancellationToken ct) =>
            {
                var login = HttpContextExtensions.GetLogin(ctx);
                var isAdmin = !string.IsNullOrWhiteSpace(login) && await admins.IsAdminAsync(login, ct);
                
                // если логина нет 

                return Results.Json(new { login, isAdmin });
            });
        }
    }
}