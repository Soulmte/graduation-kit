import os
import pymysql
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.exceptions import RequestEntityTooLarge
from config import Config
from utils.database import Database, test_connection
from utils.response import Result, ResultCode
from services.user_service import BizError
from middleware.request_logger import request_logger

# 导入控制器
from controllers.user_controller import user_bp
from controllers.notice_controller import notice_bp
from controllers.log_controller import log_bp
from controllers.file_controller import file_bp


def create_app():
    """创建Flask应用"""
    app = Flask(__name__)
    app.config.from_object(Config)

    # CORS
    CORS(app)

    # 确保上传目录存在
    os.makedirs(Config.UPLOAD_DIR, exist_ok=True)

    # 注册蓝图
    app.register_blueprint(user_bp)
    app.register_blueprint(notice_bp)
    app.register_blueprint(log_bp)
    app.register_blueprint(file_bp)

    # 静态文件服务
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        return send_from_directory(Config.UPLOAD_DIR, filename)

    # 健康检查（含数据库连通性）
    @app.route('/api/health')
    @request_logger
    def health():
        try:
            Database.execute_one('SELECT 1')
            db_status = 'ok'
        except Exception as e:
            # dev only — 错误详情只进控制台，不向外暴露数据库信息
            print(f'健康检查失败: {e}')
            db_status = 'error'
        return jsonify({
            'code': 200,
            'message': '操作成功',
            'data': {'service': 'Flask', 'database': db_status}
        })

    # 全局异常处理
    @app.errorhandler(BizError)
    def handle_biz_error(e):
        return Result.error(e.message, e.code)

    @app.errorhandler(RequestEntityTooLarge)
    def handle_file_too_large(e):
        return Result.error('文件大小超出限制', ResultCode.BAD_REQUEST)

    @app.errorhandler(pymysql.err.IntegrityError)
    def handle_integrity_error(e):
        # 唯一索引冲突：并发插入重复数据时由数据库约束兜住
        print(f'数据库约束冲突: {e}')
        return Result.error('数据已存在', ResultCode.BAD_REQUEST)

    @app.errorhandler(Exception)
    def handle_exception(e):
        # 系统异常：不向前端暴露详情，避免泄露内部实现
        print(f'系统异常: {e}')
        return Result.error('服务器内部错误', ResultCode.INTERNAL_ERROR)

    return app


if __name__ == '__main__':
    test_connection()

    app = create_app()

    print('========================================')
    print('  Flask + MySQL Backend Server')
    print('========================================')
    print(f'  Server:   http://localhost:{Config.PORT}')
    print(f'  Database: {Config.DB_NAME}')
    print('========================================')

    app.run(host='0.0.0.0', port=Config.PORT, debug=Config.DEBUG)
