using System.ComponentModel;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace OpenMcp.Domain.Prompts.Models;


[JsonConverter(typeof(Converter))]
public abstract class PromptContentBlock
{
    /// <summary>Prevent external derivations.</summary>
    private protected PromptContentBlock()
    {
    }

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    
    [EditorBrowsable(EditorBrowsableState.Never)]
    public class Converter : JsonConverter<PromptContentBlock>
    {
        /// <inheritdoc/>
        public override PromptContentBlock? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
            {
                return null;
            }

            if (reader.TokenType != JsonTokenType.StartObject)
            {
                throw new JsonException();
            }

            string? type = null;
            string? text = null;
            string? internalName = null;

            while (reader.Read() && reader.TokenType != JsonTokenType.EndObject)
            {
                if (reader.TokenType != JsonTokenType.PropertyName)
                {
                    continue;
                }

                string? propertyName = reader.GetString();

                // Move to the value token for the current property
                if (!reader.Read())
                {
                    throw new JsonException();
                }

                switch (propertyName)
                {
                    case "type":
                        type = reader.GetString();
                        break;

                    case "text":
                        text = reader.GetString();
                        break;

                    case "internal_name":
                        internalName = reader.GetString();
                        break;

                    default:
                        break;
                }
            }

            return type switch
            {
                "text" => new PromptTextContentBlock
                {
                    Text = text ?? throw new JsonException("Text contents must be provided for 'text' type."),
                },

                "resource_link" => new PromptResourceLinkBlock
                {
                    InternalName = internalName ?? throw new JsonException("Name must be provided for 'resource_link' type."),
                },

                _ => throw new JsonException($"Unknown content type: '{type}'"),
            };
        }

        public override void Write(Utf8JsonWriter writer, PromptContentBlock value, JsonSerializerOptions options)
        {
            if (value is null)
            {
                writer.WriteNullValue();
                return;
            }

            writer.WriteStartObject();

            writer.WriteString("type", value.Type);

            switch (value)
            {
                case PromptTextContentBlock textContent:
                    writer.WriteString("text", textContent.Text);
                    break;

                case PromptResourceLinkBlock resourceLink:
                    writer.WriteString("internal_name", resourceLink.InternalName);
                    break;
            }

            writer.WriteEndObject();
        }
    }
}

public sealed class PromptTextContentBlock : PromptContentBlock
{
    public PromptTextContentBlock() => Type = "text";

    [JsonPropertyName("text")]
    public required string Text { get; set; }
}

public sealed class PromptResourceLinkBlock : PromptContentBlock
{
    public PromptResourceLinkBlock() => Type = "resource_link";

    [JsonPropertyName("internal_name")]
    public required string InternalName { get; set; }
}