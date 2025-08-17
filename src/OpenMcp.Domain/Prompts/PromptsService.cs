using OpenMcp.Domain.Admins;
using OpenMcp.Domain.Models;
using OpenMcp.Domain.Primitives;
using OpenMcp.Domain.Prompts.Models;
using OpenMcp.Domain.Resources;
using OpenMcp.Domain.Resources.Models;

namespace OpenMcp.Domain.Prompts;

public sealed class PromptsService(
    IPrimitivesRepository<PromptRecord> promptsRepository,
    IResourcesMongoClient resourcesMongoClient,
    IAdminRepository admins) : PrimitivesService<PromptRecord>(promptsRepository, admins)
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

    public async Task<(PromptRecord? Prompt, ResourceRecord[]? Resources)> GetLatestApprovedWithResourcesAsync(string name, CancellationToken ct)
    {
        var pr = await GetLatestApprovedAsync(name, ct);
        if (pr == null) return (null, null);

        var internalResourcesNames = pr.Messages.Select(m => m.Content switch
        {
            PromptResourceLinkBlock resourceLinkContent => resourceLinkContent.InternalName,
            _ => null
        }).Where(n => n != null).Select(n => n!).ToArray();

        if (internalResourcesNames.Length == 0) return (pr, null);

        var resources = await resourcesMongoClient.ListResourcesMetadataAsync(internalResourcesNames, ct);
        return (pr, resources.ToArray());
    }
}


