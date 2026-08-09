using DotnetMysqlBackend.Utils;

namespace DotnetMysqlBackend.Exceptions
{
    /// <summary>
    /// 业务异常
    /// </summary>
    public class BusinessException : Exception
    {
        public int Code { get; }

        public BusinessException(ResultCode resultCode)
            : base(resultCode.GetMessage())
        {
            Code = (int)resultCode;
        }

        public BusinessException(ResultCode resultCode, string message)
            : base(message)
        {
            Code = (int)resultCode;
        }

        public BusinessException(string message)
            : base(message)
        {
            Code = (int)ResultCode.Error;
        }

        public BusinessException(int code, string message)
            : base(message)
        {
            Code = code;
        }
    }
}
