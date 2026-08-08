"""JWT认证中间件"""
import jwt
from functools import wraps
from flask import request, jsonify
from config import Config
from services.user_service import BizError
from utils.response import ResultCode


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')

        if not token:
            raise BizError(ResultCode.UNAUTHORIZED, '未授权，请先登录')

        if token.startswith('Bearer '):
            token = token[7:]

        try:
            payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
            request.user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({'code': 401, 'message': 'Token已过期', 'data': None}), 401
        except jwt.InvalidTokenError:
            return jsonify({'code': 401, 'message': 'Token无效', 'data': None}), 401

        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """管理员权限装饰器（必须配合 token_required 使用）"""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = getattr(request, 'user', None) or {}
        if user.get('role') != 'admin':
            raise BizError(ResultCode.FORBIDDEN, '权限不足，禁止访问')
        return f(*args, **kwargs)
    return decorated
