using DotnetMysqlBackend.Config;
using DotnetMysqlBackend.Utils;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace DotnetMysqlBackend.Middleware
{
    /// <summary>
    /// JWT认证过滤器
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class AuthAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            var jwtConfig = context.HttpContext.RequestServices.GetRequiredService<JwtConfig>();
            var authHeader = context.HttpContext.Request.Headers["Authorization"].FirstOrDefault();

            if (string.IsNullOrEmpty(authHeader))
            {
                context.Result = new JsonResult(Result.Error(ResultCode.Unauthorized))
                    { StatusCode = 200 };
                return;
            }

            var parts = authHeader.Split(' ');
            if (parts.Length != 2 || parts[0] != "Bearer")
            {
                context.HttpContext.Response.StatusCode = 401;
                context.Result = new JsonResult(new { code = 401, message = "Token无效或已过期", data = (object?)null });
                return;
            }

            var principal = jwtConfig.ValidateToken(parts[1]);
            if (principal == null)
            {
                context.HttpContext.Response.StatusCode = 401;
                context.Result = new JsonResult(new { code = 401, message = "Token无效或已过期", data = (object?)null });
                return;
            }

            // 将用户信息存入HttpContext
            context.HttpContext.Items["userId"] = principal.FindFirst("userId")?.Value;
            context.HttpContext.Items["username"] = principal.FindFirst("username")?.Value;
            context.HttpContext.Items["role"] = principal.FindFirst("role")?.Value;

            base.OnActionExecuting(context);
        }
    }

    /// <summary>
    /// 管理员权限过滤器（必须配合[Auth]使用）
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class AdminAttribute : ActionFilterAttribute
    {
        public AdminAttribute()
        {
            // 确保在Auth之后执行
            Order = 1;
        }

        public override void OnActionExecuting(ActionExecutingContext context)
        {
            // 如果Auth还没执行过，先做认证检查
            if (!context.HttpContext.Items.ContainsKey("userId"))
            {
                context.Result = new JsonResult(Result.Error(ResultCode.Unauthorized))
                    { StatusCode = 200 };
                return;
            }

            var role = context.HttpContext.Items["role"]?.ToString();
            if (role != "admin")
            {
                context.Result = new JsonResult(Result.Error(ResultCode.Forbidden))
                    { StatusCode = 200 };
                return;
            }

            base.OnActionExecuting(context);
        }
    }
}
