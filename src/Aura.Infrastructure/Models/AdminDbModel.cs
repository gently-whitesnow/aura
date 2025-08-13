using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Aura.Infrastructure.Models;

public sealed class AdminDbModel
{
	[BsonId]
	[BsonRepresentation(BsonType.ObjectId)]
	public string Id { get; set; } = default!;
	public string Login { get; set; } = default!;
}


