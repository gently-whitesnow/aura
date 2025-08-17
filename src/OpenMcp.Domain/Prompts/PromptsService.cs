using OpenMcp.Domain.Admins;
using OpenMcp.Domain.Models;
using OpenMcp.Domain.Primitives;
using OpenMcp.Domain.Prompts.Models;

namespace OpenMcp.Domain.Prompts;

public sealed class PromptsService(IPrimitivesRepository<PromptRecord> primitives, IAdminRepository admins) : PrimitivesService<PromptRecord>(primitives, admins)
{
    public Task<PromptRecord> CreateAsync(
        string name,
        string title,
        IList<PromptMessageRecord> messages,
        IList<PromptArgumentRecord>? arguments,
        string createdBy)
    {
        if (messages == null || messages.Count == 0) throw new ArgumentException("messages are required", nameof(messages));

        return CreateAsync(new PromptRecord
        {
            Name = name,
            Title = title,
            Messages = messages,
            Arguments = arguments,
            CreatedBy = createdBy
        }, createdBy);
    }
}


