import pymysql
from config import Config
from contextlib import contextmanager

class Database:
    """数据库工具类"""
    
    @staticmethod
    def get_connection():
        """获取数据库连接"""
        return pymysql.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
    
    @staticmethod
    @contextmanager
    def get_cursor():
        """获取数据库游标（上下文管理器）"""
        conn = Database.get_connection()
        cursor = conn.cursor()
        try:
            yield cursor
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()
            conn.close()
    
    @staticmethod
    def execute_query(sql, params=None):
        """执行查询（SELECT）"""
        with Database.get_cursor() as cursor:
            cursor.execute(sql, params or ())
            return cursor.fetchall()
    
    @staticmethod
    def execute_one(sql, params=None):
        """执行查询并返回单条记录"""
        with Database.get_cursor() as cursor:
            cursor.execute(sql, params or ())
            return cursor.fetchone()
    
    @staticmethod
    def execute_update(sql, params=None):
        """执行更新（INSERT/UPDATE/DELETE）"""
        with Database.get_cursor() as cursor:
            cursor.execute(sql, params or ())
            return cursor.rowcount

def test_connection():
    """测试数据库连接"""
    try:
        conn = Database.get_connection()
        conn.close()
        print('数据库连接成功')
        return True
    except Exception as e:
        print(f'数据库连接失败: {str(e)}')
        return False
