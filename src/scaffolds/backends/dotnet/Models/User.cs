namespace DotnetMysqlBackend.Models
{
    /// <summary>
    /// 用户实体
    /// </summary>
    public class User
    {
        public long Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? Password { get; set; }
        public string? Nickname { get; set; }
        public int? Age { get; set; }
        public string? Gender { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string Role { get; set; } = "user";
        public string? Avatar { get; set; }
        public DateTime? CreateTime { get; set; }
        public DateTime? UpdateTime { get; set; }
        public int Deleted { get; set; } = 0;
    }
}
