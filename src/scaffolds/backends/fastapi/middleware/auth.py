"""JWT认证中间件"""
import jwt
from fastapi import Request, HTTPException
from config import Config
from utils.response import Result, ResultCode
from services.user_service import BizError


def verify_token(request: Request):
    token = request.headers.get('Authorization')

    if not token:
        raise BizError(ResultCode.UNAUTHORIZED, '未授权，请先登录')

    if token.startswith('Bearer '):
        token = token[7:]

    try:
        payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
        # 存入 request.state 供日志中间件使用
        request.state.user = payload
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token已过期')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Token无效')
