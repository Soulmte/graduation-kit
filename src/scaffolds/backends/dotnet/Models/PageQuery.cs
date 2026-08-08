namespace DotnetMysqlBackend.Models
{
    /// <summary>
    /// 分页查询参数
    /// </summary>
    public class PageQuery
    {
        public int PageNum { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? OrderBy { get; set; }
        public string Order { get; set; } = "desc";

        // 用户查询条件
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? Role { get; set; }

        // 公告查询条件
        public string? Title { get; set; }
        public string? Content { get; set; }

        // 日志查询条件
        public string? Operation { get; set; }
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
    }
}
