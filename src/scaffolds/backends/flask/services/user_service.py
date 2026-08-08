"""用户服务"""
import jwt
from datetime import datetime, timedelta
from config import Config
from utils.database import Database
from utils.response import ResultCode, normalize_page

USER_COLUMNS = 'id, username, nickname, age, gender, phone, email, avatar, role, create_time, update_time'


class BizError(Exception):
    def __init__(self, code, message):
        self.code = code
        self.message = message
        super().__init__(message)


class UserService:

    @staticmethod
    def register(data):
        """用户注册"""
        username = data.get('username')
        password = data.get('password')
        if not username or not password:
            raise BizError(ResultCode.BAD_REQUEST, '用户名和密码不能为空')

        existing = Database.execute_one('SELECT id FROM user WHERE username = %s AND deleted = 0', (username,))
        if existing:
            raise BizError(ResultCode.USERNAME_EXIST, '用户名已存在')

        # 角色固定为普通用户，不接受前端传入，防止自行注册管理员
        Database.execute_update(
            'INSERT INTO user (username, password, nickname, age, gender, phone, email, role, create_time) '
            'VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())',
            (username, password, data.get('nickname', ''), data.get('age'), data.get('gender', ''),
             data.get('phone', ''), data.get('email', ''), 'user'))

    @staticmethod
    def login(username, password):
        """用户登录"""
        if not username or not password:
            raise BizError(ResultCode.BAD_REQUEST, '用户名和密码不能为空')

        user = Database.execute_one(
            f'SELECT {USER_COLUMNS} FROM user WHERE username = %s AND password = %s AND deleted = 0',
            (username, password))
        if not user:
            raise BizError(ResultCode.LOGIN_ERROR, '用户名或密码错误')

        token = jwt.encode({
            'id': user['id'], 'username': user['username'], 'role': user['role'],
            'exp': datetime.utcnow() + timedelta(seconds=Config.JWT_EXPIRATION)
        }, Config.JWT_SECRET, algorithm='HS256')

        return {'token': token, 'userInfo': user}

    @staticmethod
    def page_query(query):
        """分页查询用户列表（带条件）"""
        page_num, page_size, offset = normalize_page(query.get('pageNum'), query.get('pageSize'))

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
            f'SELECT {USER_COLUMNS} FROM user {where} ORDER BY {order_col} {direction} LIMIT %s OFFSET %s',
            tuple(params + [page_size, offset]))
        return {'records': records, 'total': total, 'pageNum': page_num, 'pageSize': page_size}

    @staticmethod
    def list_all():
        """查询所有用户列表"""
        records = Database.execute_query(
            f'SELECT {USER_COLUMNS} FROM user WHERE deleted = 0 ORDER BY create_time DESC')
        return records

    @staticmethod
    def get_by_id(user_id):
        """根据ID查询用户"""
        user = Database.execute_one(
            f'SELECT {USER_COLUMNS} FROM user WHERE id = %s AND deleted = 0', (user_id,))
        if not user:
            raise BizError(ResultCode.NOT_FOUND, '用户不存在')
        return user

    @staticmethod
    def update(data, current_user):
        """更新用户信息（仅允许修改自己，管理员可改任意用户）"""
        user_id = data.get('id')
        if not user_id:
            raise BizError(ResultCode.BAD_REQUEST, '用户ID不能为空')

        # 归属校验：非管理员只能修改自己的信息
        current_user = current_user or {}
        if current_user.get('role') != 'admin' and int(user_id) != int(current_user.get('id', 0)):
            raise BizError(ResultCode.FORBIDDEN, '无权修改其他用户的信息')

        # role 和 password 不开放给此接口，防止提权与越权改密
        Database.execute_update(
            'UPDATE user SET nickname = %s, age = %s, gender = %s, phone = %s, email = %s, '
            'avatar = %s, update_time = NOW() WHERE id = %s AND deleted = 0',
            (data.get('nickname', ''), data.get('age'), data.get('gender', ''), data.get('phone', ''),
             data.get('email', ''), data.get('avatar', ''), user_id))

    @staticmethod
    def update_password(data, current_user):
        """修改密码（用户ID从登录态取，不接受前端传入）"""
        old_password = data.get('oldPassword')
        new_password = data.get('newPassword')
        if not old_password or not new_password:
            raise BizError(ResultCode.BAD_REQUEST, '原密码和新密码不能为空')
        if not 6 <= len(new_password) <= 20:
            raise BizError(ResultCode.BAD_REQUEST, '新密码长度必须在6-20位之间')

        user_id = (current_user or {}).get('id')
        user = Database.execute_one('SELECT password FROM user WHERE id = %s AND deleted = 0', (user_id,))
        if not user:
            raise BizError(ResultCode.NOT_FOUND, '用户不存在')
        if user['password'] != old_password:
            raise BizError(ResultCode.PASSWORD_ERROR, '原密码错误')

        Database.execute_update(
            'UPDATE user SET password = %s, update_time = NOW() WHERE id = %s AND deleted = 0',
            (new_password, user_id))

    @staticmethod
    def delete_by_id(user_id):
        """删除用户（逻辑删除）"""
        Database.execute_update('UPDATE user SET deleted = 1 WHERE id = %s', (user_id,))

    @staticmethod
    def delete_batch(ids):
        """批量删除用户（逻辑删除）"""
        if not ids:
            raise BizError(ResultCode.BAD_REQUEST, '参数错误')
        placeholders = ','.join(['%s'] * len(ids))
        Database.execute_update(f'UPDATE user SET deleted = 1 WHERE id IN ({placeholders})', tuple(ids))
