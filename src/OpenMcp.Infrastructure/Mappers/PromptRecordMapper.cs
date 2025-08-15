using OpenMcp.Domain.Prompts.Models;
using OpenMcp.Infrastructure.Models;

namespace OpenMcp.Infrastructure.Mappers;

public static class PromptRecordMapper
{
    public static PromptRecordDbModel ToDb(this PromptRecord model)
    {
        return new PromptRecordDbModel
        {
            Name = model.Name,
            Version = model.Version,
            Status = model.Status,
            Title = model.Title,
            Messages = model.Messages.Select(m => new PromptMessageDbModel { Role = m.Role, Text = m.Text }).ToList(),
            Arguments = model.Arguments?.Select(a => new PromptArgumentDbModel { Name = a.Name, Title = a.Title, Description = a.Description, Required = a.Required }).ToList(),
            CreatedAt = model.CreatedAt,
            CreatedBy = model.CreatedBy,
            ApprovedAt = model.ApprovedAt,
            ApprovedBy = model.ApprovedBy
        };
    }

    public static PromptRecord ToDomain(this PromptRecordDbModel db)
    {
        return new PromptRecord
        {
            Name = db.Name,
            Version = db.Version,
            Status = db.Status,
            Title = db.Title,
            Messages = db.Messages.Select(m => new PromptMessageRecord { Role = m.Role, Text = m.Text }).ToList(),
            Arguments = db.Arguments?.Select(a => new PromptArgumentRecord { Name = a.Name, Title = a.Title, Description = a.Description, Required = a.Required }).ToList(),
            CreatedAt = db.CreatedAt,
            CreatedBy = db.CreatedBy,
            ApprovedAt = db.ApprovedAt,
            ApprovedBy = db.ApprovedBy
        };
    }
}


