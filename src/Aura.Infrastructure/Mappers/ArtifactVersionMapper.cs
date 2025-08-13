using Aura.Domain.Models;
using Aura.Infrastructure.Models;

namespace Aura.Infrastructure.Mappers;

public static class ArtifactVersionMapper
{
	public static ArtifactVersionDbModel ToDb(this ArtifactVersion model)
	{
		return new ArtifactVersionDbModel
		{
			Type = model.Type,
			ArtifactKey = model.ArtifactKey,
			Version = model.Version,
			Status = model.Status,
			Title = model.Title,
			Body = model.Body,
			Template = model.Template,
			Placeholders = model.Placeholders,
			CreatedAt = model.CreatedAt,
			CreatedBy = model.CreatedBy,
			ApprovedAt = model.ApprovedAt,
			ApprovedBy = model.ApprovedBy
		};
	}

	public static ArtifactVersion ToDomain(this ArtifactVersionDbModel db)
	{
		return new ArtifactVersion
		{
			Type = db.Type,
			ArtifactKey = db.ArtifactKey,
			Version = db.Version,
			Status = db.Status,
			Title = db.Title,
			Body = db.Body,
			Template = db.Template,
			Placeholders = db.Placeholders,
			CreatedAt = db.CreatedAt,
			CreatedBy = db.CreatedBy,
			ApprovedAt = db.ApprovedAt,
			ApprovedBy = db.ApprovedBy
		};
	}
}


