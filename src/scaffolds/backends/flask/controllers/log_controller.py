"""操作日志控制器"""
from flask import Blueprint, request
from services.log_service import LogService
from utils.response import Result
from middleware.auth import token_required, admin_required
from middleware.logger import log_operation
from middleware.request_logger import request_logger

log_bp = Blueprint('log', __name__, url_prefix='/api/log')


@log_bp.route('/pageQuery', methods=['POST'])
@request_logger
@token_required
@admin_required
@log_operation('分页查询操作日志')
def page_query():
    """分页查询操作日志（带条件）"""
    return Result.success(LogService.page_query(request.json))


@log_bp.route('/listAll', methods=['GET'])
@request_logger
@token_required
@admin_required
def list_all():
    """查询所有操作日志"""
    return Result.success(LogService.list_all())


@log_bp.route('/getById/<int:log_id>', methods=['GET'])
@request_logger
@token_required
@admin_required
def get_by_id(log_id):
    """根据ID查询操作日志"""
    return Result.success(LogService.get_by_id(log_id))


@log_bp.route('/deleteById/<int:log_id>', methods=['DELETE'])
@request_logger
@token_required
@admin_required
@log_operation('删除操作日志')
def delete_by_id(log_id):
    """删除操作日志"""
    LogService.delete_by_id(log_id)
    return Result.success(None, '删除成功')


@log_bp.route('/deleteBatch', methods=['DELETE'])
@request_logger
@token_required
@admin_required
@log_operation('批量删除操作日志')
def delete_batch():
    """批量删除操作日志"""
    LogService.delete_batch(request.json)
    return Result.success(None, '批量删除成功')
