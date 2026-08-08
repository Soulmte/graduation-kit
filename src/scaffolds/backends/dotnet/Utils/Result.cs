namespace DotnetMysqlBackend.Utils
{
    /// <summary>
    /// 统一响应结构
    /// </summary>
    public class Result<T>
    {
        public int Code { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }

        public static Result<T> Success(T? data = default)
        {
            return new Result<T>
            {
                Code = (int)ResultCode.Success,
                Message = ResultCode.Success.GetMessage(),
                Data = data
            };
        }

        public static Result<T> Success(string message, T? data = default)
        {
            return new Result<T>
            {
                Code = (int)ResultCode.Success,
                Message = message,
                Data = data
            };
        }

        public static Result<T> Error(string message)
        {
            return new Result<T>
            {
                Code = (int)ResultCode.Error,
                Message = message
            };
        }

        public static Result<T> Error(ResultCode code)
        {
            return new Result<T>
            {
                Code = (int)code,
                Message = code.GetMessage()
            };
        }

        public static Result<T> Build(int code, string message, T? data = default)
        {
            return new Result<T>
            {
                Code = code,
                Message = message,
                Data = data
            };
        }
    }

    /// <summary>
    /// 无数据的响应快捷类
    /// </summary>
    public static class Result
    {
        public static Result<object> Success(string? message = null)
        {
            return new Result<object>
            {
                Code = (int)ResultCode.Success,
                Message = message ?? ResultCode.Success.GetMessage()
            };
        }

        public static Result<T> Success<T>(T data)
        {
            return Result<T>.Success(data);
        }

        public static Result<T> Success<T>(string message, T data)
        {
            return Result<T>.Success(message, data);
        }

        public static Result<object> Error(string message)
        {
            return new Result<object>
            {
                Code = (int)ResultCode.Error,
                Message = message
            };
        }

        public static Result<object> Error(ResultCode code)
        {
            return new Result<object>
            {
                Code = (int)code,
                Message = code.GetMessage()
            };
        }

        public static Result<object> Build(int code, string message)
        {
            return new Result<object>
            {
                Code = code,
                Message = message
            };
        }
    }
}
