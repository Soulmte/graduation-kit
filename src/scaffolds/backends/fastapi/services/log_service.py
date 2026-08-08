"""操作日志服务"""
from utils.database import Database
from utils.response import ResultCode
from services.user_service import BizError, _format_time


class LogService:

    @staticmethod
    def page_query(query: dict):
        """分页查询操作日志（带条件）"""
        page_num = query.get('pageNum', 1)
        page_size = query.get('pageSize', 10)
        offset = (page_num - 1) * page_size

        where, params = 'WHERE 1=1', []
        if query.get('username'):
            where += ' AND username LIKE %s'; params.append(f"%{query['username']}%")
        if query.get('operation'):
            where += ' AND operation LIKE %s'; params.append(f"%{query['operation']}%")
        if query.get('startTime'):
            where += ' AND create_time >= %s'; params.append(query['startTime'])
        if query.get('endTime'):
            where += ' AND create_time <= %s'; params.append(query['endTime'])

        order_col = {'username': 'username', 'operation': 'operation', 'executeTime': 'execute_time',
                     'createTime': 'create_time'}.get(query.get('orderBy'), 'create_time')
        direction = 'ASC' if query.get('order') == 'asc' else 'DESC'

        total = Database.execute_one(f'SELECT COUNT(*) as total FROM operation_log {where}', tuple(params))['total']
        records = Database.execute_query(
            f'SELECT * FROM operation_log {where} ORDER BY {order_col} {direction} LIMIT %s OFFSET %s',
            tuple(params + [page_size, offset]))
        for r in records:
            _format_time(r)

        return {'records': records, 'total': total, 'pageNum': page_num, 'pageSize': page_size}

    @staticmethod
    def list_all():
        """查询所有操作日志"""
        records = Database.execute_query('SELECT * FROM operation_log ORDER BY create_time DESC')
        for r in records:
            _format_time(r)
        return records

    @staticmethod
    def get_by_id(log_id: int):
        """根据ID查询操作日志"""
        log = Database.execute_one('SELECT * FROM operation_log WHERE id = %s', (log_id,))
        if not log:
            raise BizError(ResultCode.NOT_FOUND, '日志不存在')
        _format_time(log)
        return log

    @staticmethod
    def delete_by_id(log_id: int):
        """删除操作日志"""
        Database.execute_update('DELETE FROM operation_log WHERE id = %s', (log_id,))

    @staticmethod
    def delete_batch(ids: list):
        """批量删除操作日志"""
        if not ids:
            raise BizError(ResultCode.BAD_REQUEST, '参数错误')
        placeholders = ','.join(['%s'] * len(ids))
        Database.execute_update(f'DELETE FROM operation_log WHERE id IN ({placeholders})', tuple(ids))
