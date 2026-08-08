"""用户服务"""
import jwt
from datetime import datetime, timedelta
from config import Config
from utils.database import Database
from utils.response import ResultCode


class UserService:

    @staticmethod
    def register(user: dict):
        """用户注册"""
        username = user.get('username')
        password = user.get('password')
        if not username or not password:
            raise BizError(ResultCode.BAD_REQUEST, '用户名和密码不能为空')

        existing = Database.execute_one(
            'SELECT id FROM user WHERE username = %s AND deleted = 0', (username,))
        if existing:
            raise BizError(ResultCode.USERNAME_EXIST, '用户名已存在')

        Database.execute_update(
            'INSERT INTO user (username, password, nickname, age, gender, phone, email, role, create_time) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())',
            (username, password, user.get('nickname', ''), user.get('age'), user.get('gender', ''),
             user.get('phone', ''), user.get('email', ''), user.get('role', 'user')))

    @staticmethod
    def login(username: str, password: str):
        """用户登录"""
        if not username or not password:
            raise BizError(ResultCode.BAD_REQUEST, '用户名和密码不能为空')

        user = Database.execute_one(
            'SELECT * FROM user WHERE username = %s AND password = %s AND deleted = 0',
            (username, password))
        if not user:
            raise BizError(ResultCode.LOGIN_ERROR, '用户名或密码错误')

        token = jwt.encode({
            'id': user['id'], 'username': user['username'], 'role': user['role'],
            'exp': datetime.utcnow() + timedelta(seconds=Config.JWT_EXPIRATION)
        }, Config.JWT_SECRET, algorithm='HS256')

        user.pop('password', None)
        user.pop('deleted', None)
        _format_time(user)
        return {'token': token, 'userInfo': user}

    @staticmethod
    def page_query(query: dict):
        """分页查询用户列表（带条件�?""
        page_num = query.get('pageNum', 1)
        page_size = query.get('pageSize', 10)
        offset = (page_num - 1) * page_size

        where, params = 'WHERE deleted = 0', []
        if query.get('username'):
            where += ' AND username LIKE %s'; params.append(f"%{query['username']}%")
        if query.get('email'):
            where += ' AND email LIKE %s'; params.append(f"%{query['email']}%")
        if query.get('role'):
            where += ' AND role = %s'; params.append(query['role'])

        order_col = {'username': 'username', 'email': 'email', 'role': 'role', 'createTime': 'create_time'}.get(
            query.get('orderBy'), 'create_time')
        direction = 'ASC' if query.get('order') == 'asc' else 'DESC'

        total = Database.execute_one(f'SELECT COUNT(*) as total FROM user {where}', tuple(params))['total']
        records = Database.execute_query(
            f'SELECT id, username, nickname, age, gender, phone, email, avatar, role, create_time, update_time FROM user {where} ORDER BY {order_col} {direction} LIMIT %s OFFSET %s',
            tuple(params + [page_size, offset]))
        for r in records:
            _format_time(r)

        return {'records': records, 'total': total, 'pageNum': page_num, 'pageSize': page_size}

    @staticmethod
    def list_all():
        """查询所有用户列�?""
        records = Database.execute_query(
            'SELECT id, username, nickname, age, gender, phone, email, avatar, role, create_time, update_time FROM user WHERE deleted = 0 ORDER BY create_time DESC')
        for r in records:
            _format_time(r)
        return records

    @staticmethod
    def get_by_id(user_id: int):
        """根据ID查询用户"""
        user = Database.execute_one(
            'SELECT id, username, nickname, age, gender, phone, email, avatar, role, create_time, update_time FROM user WHERE id = %s AND deleted = 0',
            (user_id,))
        if not user:
            raise BizError(ResultCode.NOT_FOUND, '用户不存�?)
        _format_time(user)
        return user

    @staticmethod
    def update(user: dict):
        """更新用户信息"""
        user_id = user.get('id')
        if not user_id:
            raise BizError(ResultCode.BAD_REQUEST, '用户ID不能为空')

        sql = 'UPDATE user SET nickname = %s, age = %s, gender = %s, phone = %s, email = %s, avatar = %s, role = %s, update_time = NOW()'
        params = [user.get('nickname', ''), user.get('age'), user.get('gender', ''),
                  user.get('phone', ''), user.get('email', ''), user.get('avatar', ''), user.get('role', 'user')]

        if user.get('password'):
            sql += ', password = %s'
            params.append(user['password'])

        sql += ' WHERE id = %s AND deleted = 0'
        params.append(user_id)
        Database.execute_update(sql, tuple(params))

    @staticmethod
    def delete_by_id(user_id: int):
        """删除用户（逻辑删除�?""
        Database.execute_update('UPDATE user SET deleted = 1 WHERE id = %s', (user_id,))

    @staticmethod
    def delete_batch(ids: list):
        """批量删除用户（逻辑删除�?""
        if not ids:
            raise BizError(ResultCode.BAD_REQUEST, '参数错误')
        placeholders = ','.join(['%s'] * len(ids))
        Database.execute_update(f'UPDATE user SET deleted = 1 WHERE id IN ({placeholders})', tuple(ids))


class BizError(Exception):
    """业务异常"""
    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


def _format_time(record: dict):
    """格式化时间字�?""
    for key in ('create_time', 'update_time'):
        if key in record and record[key] is not None:
            record[key] = str(record[key])
