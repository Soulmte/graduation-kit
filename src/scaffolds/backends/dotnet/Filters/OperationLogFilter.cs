using System.Diagnostics;
using System.Text.Json;
using System.Text.RegularExpressions;
using DotnetMysqlBackend.Config;
using DotnetMysqlBackend.Models;
using Microsoft.AspNetCore.Mvc.Filters;
using MySql.Data.MySqlClient;

namespace DotnetMysqlBackend.Filters
{
    /// <summary>
    /// 操作日志特性 - 标记需要记录日志的Action
    /// </summary>
    [AttributeUsage(AttributeTargets.Method)]
    public class LogAttribute : Attribute
    {
        public string Description { get; }
        public bool SaveParams { get; set; } = true;

        public LogAttribute(string description)
        {
            Description = description;
        }
    }

    /// <summary>
    /// 操作日志过滤器 - 自动记录带[Log]标记的操作
    /// 无论成功或失败都会记录日志（登录失败、业务异常也会被记录）
    /// </summary>
    public class OperationLogFilter : IAsyncActionFilter
    {
        private static readonly Regex PasswordRegex = new(@"(""password""\s*:\s*)""[^""]*""", RegexOptions.Compiled);

        private readonly DatabaseConfig _db;
        private readonly ILogger<OperationLogFilter> _logger;

        public OperationLogFilter(DatabaseConfig db, ILogger<OperationLogFilter> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var logAttr = context.ActionDescriptor.EndpointMetadata
                .OfType<LogAttribute>().FirstOrDefault();

            if (logAttr == null)
            {
                await next();
                return;
            }

            // 提前提取用户名
            var username = ExtractUsername(context, logAttr.Description);

            // 提前提取方法名 / IP / 参数（避免在 Task.Run 中访问已释放的上下文）
            var method = $"{context.Controller.GetType().Name}.{context.ActionDescriptor.RouteValues["action"]}";
            var ip = GetIpAddress(context.HttpContext.Request);
            var paramsJson = logAttr.SaveParams ? SerializeParams(context.ActionArguments) : null;

            var stopwatch = Stopwatch.StartNew();
            var executed = await next();
            stopwatch.Stop();

            // 登录成功后 HttpContext.Items["username"] 可能被设置，这里更新一次
            if (username == "anonymous" && context.HttpContext.Items["username"] is string loggedIn && !string.IsNullOrEmpty(loggedIn))
            {
                username = loggedIn;
            }

            // 判断操作成功或失败
            var operation = logAttr.Description;
            if (executed.Exception != null)
            {
                operation = TruncateOperation($"{operation}[失败:{executed.Exception.Message}]");
            }
            else if (executed.Result is Microsoft.AspNetCore.Mvc.ObjectResult objectResult)
            {
                var code = ExtractCode(objectResult.Value);
                if (code.HasValue && code.Value != 200)
                {
                    var message = ExtractMessage(objectResult.Value) ?? "未知错误";
                    operation = TruncateOperation($"{operation}[失败:{message}]");
                }
            }

            // 异步保存日志（值类型已捕获，不访问 context）
            var elapsed = stopwatch.ElapsedMilliseconds;
            _ = Task.Run(() => SaveLog(username, operation, method, paramsJson, elapsed, ip));
        }

        private static string ExtractUsername(ActionExecutingContext context, string description)
        {
            // 优先从 HttpContext.Items 取（Auth 中间件设置的）
            if (context.HttpContext.Items["username"] is string username && !string.IsNullOrEmpty(username))
            {
                return username;
            }

            // 登录/注册从请求参数中取
            if (description.Contains("登录") || description.Contains("注册"))
            {
                if (context.ActionArguments.Values.FirstOrDefault() is User user && !string.IsNullOrEmpty(user.Username))
                {
                    return user.Username;
                }
            }
            return "anonymous";
        }

        private static string? SerializeParams(IDictionary<string, object?> args)
        {
            if (args.Count == 0) return null;
            try
            {
                var json = JsonSerializer.Serialize(args);
                json = PasswordRegex.Replace(json, "$1\"***\"");
                if (json.Length > 2000)
                    json = json[..2000] + "...";
                return json;
            }
            catch
            {
                return "参数序列化失败";
            }
        }

        private static int? ExtractCode(object? value)
        {
            if (value == null) return null;
            var prop = value.GetType().GetProperty("Code");
            return prop?.GetValue(value) as int?;
        }

        private static string? ExtractMessage(object? value)
        {
            if (value == null) return null;
            var prop = value.GetType().GetProperty("Message");
            return prop?.GetValue(value) as string;
        }

        private static string TruncateOperation(string op) =>
            op.Length > 100 ? op[..100] : op;

        private async Task SaveLog(string username, string operation, string method, string? paramsJson, long executeTime, string ip)
        {
            try
            {
                await using var conn = _db.GetConnection();
                await conn.OpenAsync();
                var sql = @"INSERT INTO operation_log (username, operation, method, params, execute_time, ip, create_time)
                            VALUES (@username, @operation, @method, @params, @executeTime, @ip, NOW())";
                await using var cmd = new MySqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@username", username);
                cmd.Parameters.AddWithValue("@operation", operation);
                cmd.Parameters.AddWithValue("@method", method);
                cmd.Parameters.AddWithValue("@params", (object?)paramsJson ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@executeTime", executeTime);
                cmd.Parameters.AddWithValue("@ip", ip);
                await cmd.ExecuteNonQueryAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "保存操作日志失败");
            }
        }

        private static string GetIpAddress(HttpRequest request)
        {
            var ip = request.Headers["X-Forwarded-For"].FirstOrDefault()
                  ?? request.Headers["X-Real-IP"].FirstOrDefault()
                  ?? request.HttpContext.Connection.RemoteIpAddress?.ToString()
                  ?? "unknown";

            if (ip.Contains(','))
                ip = ip.Split(',')[0].Trim();

            return ip;
        }
    }
}
