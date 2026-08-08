using DotnetMysqlBackend.Exceptions;
using DotnetMysqlBackend.Utils;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace DotnetMysqlBackend.Filters
{
    /// <summary>
    /// 全局异常过滤器
    /// </summary>
    public class GlobalExceptionFilter : IExceptionFilter
    {
        private readonly ILogger<GlobalExceptionFilter> _logger;

        public GlobalExceptionFilter(ILogger<GlobalExceptionFilter> logger)
        {
            _logger = logger;
        }

        public void OnException(ExceptionContext context)
        {
            if (context.Exception is BusinessException biz)
            {
                _logger.LogWarning("业务异常：{Message}", biz.Message);
                context.Result = new JsonResult(Result.Build(biz.Code, biz.Message));
            }
            else
            {
                _logger.LogError(context.Exception, "系统异常");
                context.Result = new JsonResult(Result.Error("服务器内部错误"));
            }

            context.ExceptionHandled = true;
        }
    }
}
