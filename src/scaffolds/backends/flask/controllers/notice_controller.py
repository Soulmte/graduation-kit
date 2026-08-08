"""公告控制器"""
from flask import Blueprint, request
from services.notice_service import NoticeService
from utils.response import Result
from middleware.auth import token_required, admin_required
from middleware.logger import log_operation
from middleware.request_logger import request_logger

notice_bp = Blueprint('notice', __name__, url_prefix='/api/notice')


@notice_bp.route('/add', methods=['POST'])
@request_logger
@token_required
@admin_required
@log_operation('创建公告')
def add():
    """创建公告"""
    current_user = getattr(request, 'user', None) or {}
    NoticeService.add(request.json, current_user.get('username'))
    return Result.success(None, '创建成功')


@notice_bp.route('/pageQuery', methods=['POST'])
@request_logger
@token_required
@log_operation('分页查询公告')
def page_query():
    """分页查询公告列表（带条件）"""
    return Result.success(NoticeService.page_query(request.json))


@notice_bp.route('/listAll', methods=['GET'])
@request_logger
@token_required
@log_operation('查询公告列表')
def list_all():
    """查询所有公告列表"""
    return Result.success(NoticeService.list_all())


@notice_bp.route('/getById/<int:notice_id>', methods=['GET'])
@request_logger
@token_required
@log_operation('查询公告详情')
def get_by_id(notice_id):
    """根据ID查询公告"""
    return Result.success(NoticeService.get_by_id(notice_id))


@notice_bp.route('/update', methods=['PUT'])
@request_logger
@token_required
@admin_required
@log_operation('更新公告')
def update():
    """更新公告"""
    NoticeService.update(request.json)
    return Result.success(None, '更新成功')


@notice_bp.route('/deleteById/<int:notice_id>', methods=['DELETE'])
@request_logger
@token_required
@admin_required
@log_operation('删除公告')
def delete_by_id(notice_id):
    """删除公告（逻辑删除）"""
    NoticeService.delete_by_id(notice_id)
    return Result.success(None, '删除成功')


@notice_bp.route('/deleteBatch', methods=['DELETE'])
@request_logger
@token_required
@admin_required
@log_operation('批量删除公告')
def delete_batch():
    """批量删除公告（逻辑删除）"""
    NoticeService.delete_batch(request.json)
    return Result.success(None, '批量删除成功')
