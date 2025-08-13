using Aura.Domain.Models;
using Aura.Infrastructure.Models;

namespace Aura.Infrastructure.Mappers;

public static class ArtifactMapper
{
	public static ArtifactDbModel ToDb(this Artifact model)
	{
		return new ArtifactDbModel
		{
			Type = model.Type,
			Key = model.Key,
			Title = model.Title,
			ActiveVersion = model.ActiveVersion,
			CreatedAt = model.CreatedAt,
			CreatedBy = model.CreatedBy,
			UpdatedAt = model.UpdatedAt,
			UpdatedBy = model.UpdatedBy
		};
	}

	public static Artifact ToDomain(this ArtifactDbModel db)
	{
		return new Artifact
		{
			Type = db.Type,
			Key = db.Key,
			Title = db.Title,
			ActiveVersion = db.ActiveVersion,
			CreatedAt = db.CreatedAt,
			CreatedBy = db.CreatedBy,
			UpdatedAt = db.UpdatedAt,
			UpdatedBy = db.UpdatedBy
		};
	}
}


