using Aura.Domain.Models;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Aura.Infrastructure.Models;

public sealed class ArtifactVersionDbModel
{
	[BsonId]
	[BsonRepresentation(BsonType.ObjectId)]
	public string Id { get; set; } = default!;
	public ArtifactType Type { get; set; }
	public string ArtifactKey { get; set; } = default!;
	public int Version { get; set; }
	public VersionStatus Status { get; set; } = VersionStatus.Pending;

	public string Title { get; set; } = default!;
	public string? Body { get; set; }
	public string? Template { get; set; }
	public string[]? Placeholders { get; set; }

	public DateTime CreatedAt { get; set; }
	public string CreatedBy { get; set; } = default!;
	public DateTime? ApprovedAt { get; set; }
	public string? ApprovedBy { get; set; }
}


