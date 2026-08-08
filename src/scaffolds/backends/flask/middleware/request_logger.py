"""请求日志中间件（开发期彩色输出）"""
from functools import wraps
from flask import request
from datetime import datetime
from colorama import Fore, Style, init

init(autoreset=True)

def request_logger(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        start_time = datetime.now()

        response = f(*args, **kwargs)

        duration = (datetime.now() - start_time).total_seconds() * 1000

        if isinstance(response, tuple):
            status_code = response[1] if len(response) > 1 else 200
            response_data = response[0].get_json() if hasattr(response[0], 'get_json') else {}
        else:
            status_code = 200
            response_data = response.get_json() if hasattr(response, 'get_json') else {}

        if isinstance(response_data, dict) and 'code' in response_data:
            status_code = response_data['code']

        if status_code == 200:
            status_color = Fore.GREEN
        elif 400 <= status_code < 500:
            status_color = Fore.YELLOW
        elif status_code >= 500:
            status_color = Fore.RED
        else:
            status_color = Fore.BLUE

        # dev only — 开发期彩色请求日志
        print(
            f"{Fore.WHITE}[{datetime.now().strftime('%H:%M:%S')}]",
            f"{Fore.CYAN}{request.method:<6}",
            f"{Fore.WHITE}{request.path:<30}",
            f"{status_color}CODE: {status_code}",
            f"{Fore.MAGENTA}{duration:.0f}ms"
        )

        return response

    return decorated
