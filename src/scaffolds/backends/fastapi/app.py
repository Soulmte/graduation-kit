import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from config import Config
from utils.database import Database, test_connection
from utils.response import Result
from services.user_service import BizError
from middleware.request_logger import log_request

# 导入路由
from routers import user, notice, log, file


def create_app():
    """创建FastAPI应用"""
    app = FastAPI(title="FastAPI + MySQL Backend")

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 请求日志中间件
    app.middleware("http")(log_request)

    # 全局异常处理
    @app.exception_handler(BizError)
    async def biz_error_handler(request: Request, exc: BizError):
        return JSONResponse(content=Result.error(exc.message, exc.code))

    @app.exception_handler(Exception)
    async def global_error_handler(request: Request, exc: Exception):
        print(f'系统异常: {exc}')
        return JSONResponse(content=Result.error(str(exc)))

    # 确保上传目录存在
    os.makedirs(Config.UPLOAD_DIR, exist_ok=True)

    # 静态文件服务
    app.mount("/uploads", StaticFiles(directory=Config.UPLOAD_DIR), name="uploads")

    # 注册路由
    app.include_router(user.router)
    app.include_router(notice.router)
    app.include_router(log.router)
    app.include_router(file.router)

    # 健康检查（含数据库连通性）
    @app.get('/api/health')
    async def health():
        try:
            Database.execute_one('SELECT 1')
            db_status = 'ok'
        except Exception as e:
            db_status = f'error: {str(e)}'
        return {
            'code': 200,
            'message': '操作成功',
            'data': {'service': 'FastAPI', 'database': db_status}
        }

    return app


if __name__ == '__main__':
    import uvicorn

    test_connection()

    print('========================================')
    print('  FastAPI + MySQL Backend Server')
    print('========================================')
    print(f'  Server:   http://localhost:{Config.PORT}')
    print(f'  Database: {Config.DB_NAME}')
    print(f'  Docs:     http://localhost:{Config.PORT}/docs')
    print('========================================')

    app = create_app()
    uvicorn.run(app, host='0.0.0.0', port=Config.PORT)
