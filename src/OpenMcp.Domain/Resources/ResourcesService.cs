using System.Text;
using OpenMcp.Domain.Admins;
using OpenMcp.Domain.Models;
using OpenMcp.Domain.Primitives;
using OpenMcp.Domain.Resources.Models;

namespace OpenMcp.Domain.Resources;

public sealed class ResourcesService(
    IPrimitivesRepository<ResourceRecord> primitivesRepository,
    IAdminRepository admins,
    IResourceChangeNotifier changeNotifier) : PrimitivesService<ResourceRecord>(primitivesRepository, admins)
{
 
    public  Task<ResourceRecord> CreateAsync(
        string name,
        string title,
        string? uri,
        string? text,
        string? description,
        string? mimeType,
        AnnotationsRecord? annotations,
        string createdBy)
    {
        long? size = null;
        if (!string.IsNullOrEmpty(text))
            size = Encoding.UTF8.GetByteCount(text);

        return CreateAsync(new ResourceRecord
        {
            Name = name,
            Title = title,
            Uri = uri,
            Text = text,
            Description = description,
            MimeType = mimeType,
            Annotations = annotations,
            Size = size,
        }, createdBy);
    }

    public async Task UpdateStatusWithNotifyAsync(string name, int version, VersionStatus status, string adminLogin)
    {
        var normalized = Validation.NormalizeKey(name);
        await base.UpdateStatusAsync(normalized, version, status, adminLogin);

        var uri = $"open-mcp://resource/{normalized}";
        await changeNotifier.NotifyUpdatedAsync(uri);
    }

    public async Task DeleteWithNotifyAsync(string name, int version, string adminLogin)
    {
        var normalized = Validation.NormalizeKey(name);
        await base.DeleteAsync(normalized, version, adminLogin);

        var uri = $"open-mcp://resource/{normalized}";
        await changeNotifier.NotifyUpdatedAsync(uri);
    }
}


