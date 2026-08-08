namespace DotnetMysqlBackend.Utils
{
    /// <summary>
    /// 统一状态码枚举
    /// </summary>
    public enum ResultCode
    {
        Success = 200,
        Error = 500,
        ParamError = 400,
        Unauthorized = 401,
        Forbidden = 403,
        NotFound = 404,
        LoginError = 1001,
        UsernameExist = 1002,
    }

    public static class ResultCodeExtensions
    {
        public static string GetMessage(this ResultCode code) => code switch
        {
            ResultCode.Success => "操作成功",
            ResultCode.Error => "操作失败",
            ResultCode.ParamError => "参数错误",
            ResultCode.Unauthorized => "未授权，请先登录",
            ResultCode.Forbidden => "权限不足，禁止访问",
            ResultCode.NotFound => "资源不存在",
            ResultCode.LoginError => "用户名或密码错误",
            ResultCode.UsernameExist => "用户名已存在",
            _ => "未知错误"
        };
    }
}
