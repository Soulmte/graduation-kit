"""用户控制器"""
from flask import Blueprint, request
from services.user_service import UserService
from utils.response import Result
from middleware.auth import token_required, admin_required
from middleware.logger import log_operation
from middleware.request_logger import request_logger

user_bp = Blueprint('user', __name__, url_prefix='/api/user')


@user_bp.route('/register', methods=['POST'])
@request_logger
@log_operation('用户注册')
def register():
    """用户注册"""
    UserService.register(request.json)
    return Result.success(None, '注册成功')


@user_bp.route('/login', methods=['POST'])
@request_logger
@log_operation('用户登录')
def login():
    """用户登录"""
    data = request.json
    result = UserService.login(data.get('username', ''), data.get('password', ''))
    return Result.success(result, '登录成功')


@user_bp.route('/pageQuery', methods=['POST'])
@request_logger
@token_required
@admin_required
@log_operation('分页查询用户')
def page_query():
    """分页查询用户列表（带条件）"""
    return Result.success(UserService.page_query(request.json))


@user_bp.route('/listAll', methods=['GET'])
@request_logger
@token_required
@admin_required
@log_operation('查询用户列表')
def list_all():
    """查询所有用户列表"""
    return Result.success(UserService.list_all())


@user_bp.route('/getById/<int:user_id>', methods=['GET'])
@request_logger
@token_required
@log_operation('查询用户详情')
def get_by_id(user_id):
    """根据ID查询用户"""
    return Result.success(UserService.get_by_id(user_id))


@user_bp.route('/update', methods=['PUT'])
@request_logger
@token_required
@log_operation('更新用户信息')
def update():
    """更新用户信息"""
    UserService.update(request.json, getattr(request, 'user', None))
    return Result.success(None, '更新成功')


@user_bp.route('/updatePassword', methods=['PUT'])
@request_logger
@token_required
@log_operation('修改密码')
def update_password():
    """修改密码（只能改自己的，需校验原密码）"""
    UserService.update_password(request.json, getattr(request, 'user', None))
    return Result.success(None, '密码修改成功')


@user_bp.route('/deleteById/<int:user_id>', methods=['DELETE'])
@request_logger
@token_required
@admin_required
@log_operation('删除用户')
def delete_by_id(user_id):
    """删除用户（逻辑删除）"""
    UserService.delete_by_id(user_id)
    return Result.success(None, '删除成功')


@user_bp.route('/deleteBatch', methods=['DELETE'])
@request_logger
@token_required
@admin_required
@log_operation('批量删除用户')
def delete_batch():
    """批量删除用户（逻辑删除）"""
    UserService.delete_batch(request.json)
    return Result.success(None, '批量删除成功')
