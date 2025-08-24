using Serilog;

namespace OpenMcp.Server.Logging;

public static class BootstrapLogger
{
    public static Serilog.ILogger Create()
    {
        return new LoggerConfiguration()
            .WriteTo.Console()
            .CreateLogger();
    }
} 