using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using OpenMcp.Domain.Models;

namespace OpenMcp.Infrastructure.Models;

public sealed class AdminDbModel
{
	[BsonId]
	[BsonRepresentation(BsonType.ObjectId)]
	public string Id { get; set; } = default!;
	public string Login { get; set; } = default!;

	public static AdminDbModel ToDb(Admin model)
	{
		return new AdminDbModel
		{
			Login = model.Login
		};
	}

	public static Admin ToDomain(AdminDbModel db)
	{
		return new Admin
		{
			Login = db.Login
		};
	}
}


