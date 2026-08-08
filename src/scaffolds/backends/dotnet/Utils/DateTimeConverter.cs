using System.Text.Json;
using System.Text.Json.Serialization;

namespace DotnetMysqlBackend.Utils
{
    /// <summary>
    /// DateTime JSON 序列化/反序列化: yyyy-MM-dd HH:mm:ss
    /// 与其他后端(Spring Boot / Go / Express / Python)统一格式
    /// </summary>
    public class DateTimeConverter : JsonConverter<DateTime?>
    {
        private const string Format = "yyyy-MM-dd HH:mm:ss";

        public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var str = reader.GetString();
            if (string.IsNullOrEmpty(str)) return null;
            return DateTime.Parse(str);
        }

        public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
        {
            if (value.HasValue)
                writer.WriteStringValue(value.Value.ToString(Format));
            else
                writer.WriteNullValue();
        }
    }
}
