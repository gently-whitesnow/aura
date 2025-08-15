using OpenMcp.Domain.Models;
using OpenMcp.Infrastructure.Models;

namespace OpenMcp.Infrastructure.Mappers;

public static class AdminMapper
{
	public static AdminDbModel ToDb(this Admin model)
	{
		return new AdminDbModel
		{
			Login = model.Login
		};
	}

	public static Admin ToDomain(this AdminDbModel db)
	{
		return new Admin
		{
			Login = db.Login
		};
	}
}


