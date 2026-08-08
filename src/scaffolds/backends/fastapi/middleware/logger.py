"""操作日志装饰器"""
import time
import json
from functools import wraps
from utils.database import Database


def log_operation(operation: str):
    """
    操作日志装饰器
    无论成功或失败都记录日志（登录失败、业务异常也会被记录）

    使用约定：被装饰的函数需要接受 request: Request 参数
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request = kwargs.get('request')
            start_time = time.time()

            # 提前读取并缓存请求体（FastAPI request.body 只能读一次）
            cached_body = None
            if request is not None and request.method in ('POST', 'PUT', 'DELETE'):
                try:
                    cached_body = await request.body()
                    # 缓存到 state，供后续 json() 复用
                    request._body = cached_body
                except Exception:
                    pass

            # 提前提取用户名
            username = _extract_username(request, operation, cached_body)

            error = None
            result = None
            try:
                result = await func(*args, **kwargs)
            except Exception as e:
                error = str(e)
                raise
            finally:
                execute_time = int((time.time() - start_time) * 1000)
                _save_log(request, operation, username, cached_body, result, error, execute_time)

            return result
        return wrapper
    return decorator


def _extract_username(request, operation, cached_body):
    """提取用户名：优先从 request.state.user 取，登录/注册时从请求体取"""
    if request is None:
        return 'anonymous'

    user_info = getattr(request.state, 'user', None)
    if user_info and user_info.get('username'):
        return user_info['username']

    if '登录' in operation or '注册' in operation:
        if cached_body:
            try:
                data = json.loads(cached_body)
                return data.get('username') or 'anonymous'
            except Exception:
                pass
    return 'anonymous'


def _save_log(request, operation, username, cached_body, result, error, execute_time):
    """保存操作日志"""
    try:
        if request is None:
            return

        ip = request.headers.get('x-forwarded-for') or \
             request.headers.get('x-real-ip') or \
             (request.client.host if request.client else 'unknown')
        method = f'{request.method} {request.url.path}'

        # 操作描述：失败时附加标记
        op = operation
        if error:
            op = f'{op}[失败:{error}]'[:100]
        elif isinstance(result, dict) and result.get('code') != 200:
            op = f'{op}[失败:{result.get("message", "")}]'[:100]

        # 参数（脱敏密码）
        params = None
        if cached_body:
            try:
                raw = cached_body.decode('utf-8')
                # 简单正则脱敏
                import re
                raw = re.sub(r'("password"\s*:\s*)"[^"]*"', r'\1"***"', raw)
                if len(raw) > 2000:
                    raw = raw[:2000] + '...'
                params = raw
            except Exception:
                pass

        Database.execute_update(
            'INSERT INTO operation_log (username, operation, method, params, execute_time, ip, create_time) VALUES (%s, %s, %s, %s, %s, %s, NOW())',
            (username, op, method, params, execute_time, ip))
    except Exception as e:
        print(f'日志记录失败: {e}')
