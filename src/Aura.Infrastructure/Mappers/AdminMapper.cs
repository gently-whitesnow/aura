using Aura.Domain.Models;
using Aura.Infrastructure.Models;

namespace Aura.Infrastructure.Mappers;

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


