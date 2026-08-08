namespace DotnetMysqlBackend.Models
{
    /// <summary>
    /// 操作日志实体
    /// </summary>
    public class OperationLog
    {
        public long Id { get; set; }
        public string? Username { get; set; }
        public string? Operation { get; set; }
        public string? Method { get; set; }
        public string? Params { get; set; }
        public long? ExecuteTime { get; set; }
        public string? Ip { get; set; }
        public DateTime? CreateTime { get; set; }
    }
}
