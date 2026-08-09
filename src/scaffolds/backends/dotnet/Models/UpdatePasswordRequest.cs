namespace DotnetMysqlBackend.Models
{
    /// <summary>
    /// 修改密码请求参数（用户ID取自登录态，不由前端传入）
    /// </summary>
    public class UpdatePasswordRequest
    {
        public string OldPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
