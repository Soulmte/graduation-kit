namespace DotnetMysqlBackend.Models
{
    /// <summary>
    /// 公告实体
    /// </summary>
    public class Notice
    {
        public long Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Content { get; set; }
        public DateTime? CreateTime { get; set; }
        public DateTime? UpdateTime { get; set; }
        public int Deleted { get; set; } = 0;
    }
}
