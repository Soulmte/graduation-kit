namespace DotnetMysqlBackend.Config
{
    /// <summary>
    /// 上传配置
    /// </summary>
    public class UploadConfig
    {
        public string UploadDir { get; set; } = "../../uploads";
        public long MaxFileSize { get; set; } = 10485760; // 10MB

        public UploadConfig(IConfiguration configuration)
        {
            UploadDir = configuration["UPLOAD_DIR"] ?? "../../uploads";
            MaxFileSize = long.Parse(configuration["MAX_FILE_SIZE"] ?? "10485760");
        }
    }
}
