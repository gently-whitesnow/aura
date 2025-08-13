using Aura.Domain.Models;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Aura.Infrastructure.Models;

public sealed class ArtifactDbModel
{
	[BsonId]
	[BsonRepresentation(BsonType.ObjectId)]
	public string Id { get; set; } = default!;
	public ArtifactType Type { get; set; }
	public string Key { get; set; } = default!;
	public string Title { get; set; } = default!;
	public int? ActiveVersion { get; set; }
	public DateTime CreatedAt { get; set; }
	public string CreatedBy { get; set; } = default!;
	public DateTime UpdatedAt { get; set; }
	public string UpdatedBy { get; set; } = default!;
}


