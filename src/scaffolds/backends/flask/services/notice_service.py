"""公告服务"""
from utils.database import Database
from utils.response import ResultCode, normalize_page
from services.user_service import BizError

NOTICE_COLUMNS = 'id, title, content, create_by, create_time, update_time'


class NoticeService:

    @staticmethod
    def add(data, create_by=None):
        """创建公告"""
        title = data.get('title')
        if not title:
            raise BizError(ResultCode.BAD_REQUEST, '标题不能为空')
        # 发布人从登录态取，不接受前端传入
        Database.execute_update(
            'INSERT INTO notice (title, content, create_by, create_time) VALUES (%s, %s, %s, NOW())',
            (title, data.get('content', ''), create_by))

    @staticmethod
    def page_query(query):
        """分页查询公告列表（带条件）"""
        page_num, page_size, offset = normalize_page(query.get('pageNum'), query.get('pageSize'))

        where, params = 'WHERE deleted = 0', []
        if query.get('title'):
            where += ' AND title LIKE %s'; params.append(f"%{query['title']}%")
        if query.get('content'):
            where += ' AND content LIKE %s'; params.append(f"%{query['content']}%")

        order_col = {'title': 'title', 'createTime': 'create_time', 'updateTime': 'update_time'}.get(
            query.get('orderBy'), 'create_time')
        direction = 'ASC' if query.get('order') == 'asc' else 'DESC'

        total = Database.execute_one(f'SELECT COUNT(*) as total FROM notice {where}', tuple(params))['total']
        records = Database.execute_query(
            f'SELECT {NOTICE_COLUMNS} FROM notice {where} ORDER BY {order_col} {direction} LIMIT %s OFFSET %s',
            tuple(params + [page_size, offset]))
        return {'records': records, 'total': total, 'pageNum': page_num, 'pageSize': page_size}

    @staticmethod
    def list_all():
        """查询所有公告列表"""
        records = Database.execute_query(f'SELECT {NOTICE_COLUMNS} FROM notice WHERE deleted = 0 ORDER BY create_time DESC')
        return records

    @staticmethod
    def get_by_id(notice_id):
        """根据ID查询公告"""
        notice = Database.execute_one(f'SELECT {NOTICE_COLUMNS} FROM notice WHERE id = %s AND deleted = 0', (notice_id,))
        if not notice:
            raise BizError(ResultCode.NOT_FOUND, '公告不存在')
        return notice

    @staticmethod
    def update(data):
        """更新公告"""
        notice_id = data.get('id')
        title = data.get('title')
        if not notice_id or not title:
            raise BizError(ResultCode.BAD_REQUEST, '参数错误')
        Database.execute_update(
            'UPDATE notice SET title = %s, content = %s, update_time = NOW() WHERE id = %s AND deleted = 0',
            (title, data.get('content', ''), notice_id))

    @staticmethod
    def delete_by_id(notice_id):
        """删除公告（逻辑删除）"""
        Database.execute_update('UPDATE notice SET deleted = 1 WHERE id = %s', (notice_id,))

    @staticmethod
    def delete_batch(ids):
        """批量删除公告（逻辑删除）"""
        if not ids:
            raise BizError(ResultCode.BAD_REQUEST, '参数错误')
        placeholders = ','.join(['%s'] * len(ids))
        Database.execute_update(f'UPDATE notice SET deleted = 1 WHERE id IN ({placeholders})', tuple(ids))
