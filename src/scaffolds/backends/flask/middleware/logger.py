"""操作日志装饰器"""
import time
import json
from functools import wraps
from flask import request
from utils.database import Database


def log_operation(operation):
    """
    操作日志装饰器
    无论成功或失败都记录日志（登录失败、业务异常也会被记录）
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            start_time = time.time()

            # 提前提取用户名
            username = _extract_username(operation)

            # 执行原函数（即使抛异常也要记录）
            error = None
            result = None
            try:
                result = f(*args, **kwargs)
            except Exception as e:
                error = str(e)
                raise
            finally:
                execute_time = int((time.time() - start_time) * 1000)
                _save_log(operation, username, execute_time, result, error)

            return result
        return decorated
    return decorator


def _extract_username(operation):
    """提取用户名：优先从 request.user 取，登录/注册时从请求体取"""
    username = getattr(request, 'user', {}).get('username') if hasattr(request, 'user') else None
    if username:
        return username
    if '登录' in operation or '注册' in operation:
        try:
            return request.json.get('username') or 'anonymous'
        except Exception:
            pass
    return 'anonymous'


def _save_log(operation, username, execute_time, result, error):
    """保存操作日志"""
    try:
        ip = request.headers.get('X-Forwarded-For') or \
             request.headers.get('X-Real-IP') or \
             request.remote_addr or 'unknown'
        method = f'{request.method} {request.path}'

        # 操作描述：失败时附加标记
        op = operation
        fail_msg = None
        if error:
            fail_msg = error
        elif isinstance(result, tuple) and hasattr(result[0], 'get_json'):
            # Flask jsonify 返回 Response，需要 get_json 读取
            try:
                data = result[0].get_json() if hasattr(result[0], 'get_json') else None
                if data and data.get('code') != 200:
                    fail_msg = data.get('message')
            except Exception:
                pass
        elif hasattr(result, 'get_json'):
            try:
                data = result.get_json()
                if data and data.get('code') != 200:
                    fail_msg = data.get('message')
            except Exception:
                pass

        if fail_msg:
            op = f'{op}[失败:{fail_msg}]'[:100]

        # 参数
        params = None
        try:
            if request.is_json and request.json:
                body = {k: v for k, v in request.json.items() if 'password' not in k.lower()}
                if body:
                    params = json.dumps(body, ensure_ascii=False)
                    if len(params) > 2000:
                        params = params[:2000] + '...'
        except Exception:
            pass

        Database.execute_update(
            'INSERT INTO operation_log (username, operation, method, params, execute_time, ip, create_time) VALUES (%s, %s, %s, %s, %s, %s, NOW())',
            (username, op, method, params, execute_time, ip))
    except Exception as e:
        print(f'日志记录失败: {e}')
