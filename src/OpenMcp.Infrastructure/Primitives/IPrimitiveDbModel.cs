using OpenMcp.Domain.Primitives;

namespace OpenMcp.Infrastructure.Primitives;

public interface IPrimitiveDbModel<TPrimitive> : IPrimitive where TPrimitive : IPrimitive
{
    TPrimitive ToDomain();

    static abstract IPrimitiveDbModel<TPrimitive> ToDb(TPrimitive primitive);
}