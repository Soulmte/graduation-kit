"""文件上传控制器"""
from typing import List
from fastapi import APIRouter, UploadFile, File, Depends, Query
from services.file_service import FileService
from utils.response import Result
from middleware.auth import verify_token
from middleware.logger import log_operation_sync

router = APIRouter(prefix='/api/file', tags=['文件'])


@router.post('/upload')
async def upload(file: UploadFile = File(...), user: dict = Depends(verify_token)):
    data = await FileService.upload(file)
    return Result.success(data, '上传成功')


@router.post('/uploadBatch')
async def upload_batch(files: List[UploadFile] = File(...), user: dict = Depends(verify_token)):
    data = await FileService.upload_batch(files)
    return Result.success(data, '批量上传成功')


@router.delete('/delete')
async def delete(fileName: str = Query(...), user: dict = Depends(verify_token)):
    FileService.delete(fileName)
    return Result.success(None, '删除成功')
