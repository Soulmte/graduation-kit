"""文件上传控制器"""
from flask import Blueprint, request
from services.file_service import FileService
from utils.response import Result
from middleware.auth import token_required
from middleware.logger import log_operation
from middleware.request_logger import request_logger

file_bp = Blueprint('file', __name__, url_prefix='/api/file')


@file_bp.route('/upload', methods=['POST'])
@request_logger
@token_required
@log_operation('上传文件')
def upload():
    """上传单个文件"""
    file = request.files.get('file')
    data = FileService.upload(file)
    return Result.success(data, '上传成功')


@file_bp.route('/uploadBatch', methods=['POST'])
@request_logger
@token_required
@log_operation('批量上传文件')
def upload_batch():
    """批量上传文件"""
    files = request.files.getlist('files')
    data = FileService.upload_batch(files)
    return Result.success(data, '批量上传成功')


@file_bp.route('/delete', methods=['DELETE'])
@request_logger
@token_required
@log_operation('删除文件')
def delete():
    """删除文件"""
    file_name = request.args.get('fileName')
    FileService.delete(file_name)
    return Result.success(None, '删除成功')
