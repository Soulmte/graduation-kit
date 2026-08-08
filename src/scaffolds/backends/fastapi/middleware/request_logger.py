import time
from datetime import datetime
from fastapi import Request
from colorama import Fore, Style, init

# 初始化colorama
init(autoreset=True)

async def log_request(request: Request, call_next):
    """
    请求日志中间件 - 彩色输出
    """
    start_time = time.time()
    
    # 执行请求
    response = await call_next(request)
    
    # 计算耗时
    duration = (time.time() - start_time) * 1000
    
    # 获取状态码
    status_code = response.status_code
    
    # 根据状态码选择颜色
    if status_code == 200:
        status_color = Fore.GREEN
    elif 400 <= status_code < 500:
        status_color = Fore.YELLOW
    elif status_code >= 500:
        status_color = Fore.RED
    else:
        status_color = Fore.BLUE
    
    # 输出彩色日志
    print(
        f"{Fore.WHITE}[{datetime.now().strftime('%H:%M:%S')}]",
        f"{Fore.CYAN}{request.method:<6}",
        f"{Fore.WHITE}{request.url.path:<30}",
        f"{status_color}CODE: {status_code}",
        f"{Fore.MAGENTA}{duration:.0f}ms"
    )
    
    return response
