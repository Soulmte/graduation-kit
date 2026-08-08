"""统一响应格式"""
from typing import Any


class ResultCode:
    """响应码枚举"""
    SUCCESS = 200
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    INTERNAL_ERROR = 500
    LOGIN_ERROR = 1001
    USERNAME_EXIST = 1002


class Result:
    """统一响应格式"""

    @staticmethod
    def success(data: Any = None, message: str = '操作成功'):
        return {'code': ResultCode.SUCCESS, 'message': message, 'data': data}

    @staticmethod
    def error(message: str = '操作失败', code: int = ResultCode.INTERNAL_ERROR):
        return {'code': code, 'message': message, 'data': None}
