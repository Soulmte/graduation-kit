using System.Diagnostics;

namespace DotnetMysqlBackend.Middleware
{
    /// <summary>
    /// 请求日志中间件 - 彩色输出
    /// </summary>
    public class RequestLoggerMiddleware
    {
        private readonly RequestDelegate _next;

        public RequestLoggerMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var stopwatch = Stopwatch.StartNew();

            await _next(context);

            stopwatch.Stop();

            var statusCode = context.Response.StatusCode;
            var method = context.Request.Method;
            var path = context.Request.Path;
            var duration = stopwatch.ElapsedMilliseconds;

            // 根据状态码选择颜色
            ConsoleColor statusColor;
            if (statusCode == 200)
                statusColor = ConsoleColor.Green;
            else if (statusCode >= 400 && statusCode < 500)
                statusColor = ConsoleColor.Yellow;
            else if (statusCode >= 500)
                statusColor = ConsoleColor.Red;
            else
                statusColor = ConsoleColor.Blue;

            // 输出彩色日志
            Console.ForegroundColor = ConsoleColor.White;
            Console.Write($"[{DateTime.Now:HH:mm:ss}] ");
            
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.Write($"{method,-6} ");
            
            Console.ForegroundColor = ConsoleColor.White;
            Console.Write($"{path,-30} ");
            
            Console.ForegroundColor = statusColor;
            Console.Write($"CODE: {statusCode} ");
            
            Console.ForegroundColor = ConsoleColor.Magenta;
            Console.WriteLine($"{duration}ms");
            
            Console.ResetColor();
        }
    }
}
