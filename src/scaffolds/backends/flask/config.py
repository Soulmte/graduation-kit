import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """应用配置"""

    # 服务器
    PORT = int(os.getenv('PORT', 8082))
    DEBUG = os.getenv('FLASK_ENV') == 'development'

    # 数据库
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'scaffold_db')

    # JWT
    JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key')
    JWT_EXPIRATION = 604800  # 7天

    # 文件上传（UPLOAD_DIR 为相对本目录的路径，默认指向脚手架根的 uploads）
    UPLOAD_DIR = os.path.abspath(os.path.join(
        os.path.dirname(__file__), os.getenv('UPLOAD_DIR', '../../uploads')))
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 上传大小上限 10MB
    ALLOWED_EXTENSIONS = {
        'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp',
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
        'txt', 'zip', 'rar', '7z'
    }
