"""统一响应格式"""
import re
from datetime import date, datetime
from decimal import Decimal
from flask import jsonify

_SNAKE_RE = re.compile(r'_([a-z])')


def _to_camel(key):
    """下划线转驼峰：create_time -> createTime"""
    return _SNAKE_RE.sub(lambda m: m.group(1).upper(), key)


def _keys_to_camel(data):
    """递归转换 dict/list 的键名，使数据库下划线字段对前端统一为驼峰"""
    if isinstance(data, list):
        return [_keys_to_camel(item) for item in data]
    if isinstance(data, dict):
        return {_to_camel(k): _keys_to_camel(v) for k, v in data.items()}
    if isinstance(data, (datetime, date)):
        return str(data)
    if isinstance(data, Decimal):
        return float(data)
    return data


class ResultCode:
    SUCCESS = 200
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    INTERNAL_ERROR = 500
    LOGIN_ERROR = 1001
    USERNAME_EXIST = 1002
    PASSWORD_ERROR = 1004


class Result:

    @staticmethod
    def success(data=None, message='操作成功'):
        return jsonify({'code': ResultCode.SUCCESS, 'message': message, 'data': _keys_to_camel(data)})

    @staticmethod
    def error(message='操作失败', code=ResultCode.INTERNAL_ERROR):
        return jsonify({'code': code, 'message': message, 'data': None})


def normalize_page(page_num, page_size):
    """分页参数归一：页码最小1，每页数量限制在1-500"""
    try:
        num = max(1, int(page_num or 1))
    except (TypeError, ValueError):
        num = 1
    try:
        size = min(500, max(1, int(page_size or 10)))
    except (TypeError, ValueError):
        size = 10
    return num, size, (num - 1) * size
