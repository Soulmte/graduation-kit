"""操作日志控制器"""
from fastapi import APIRouter, Depends, Request
from services.log_service import LogService
from utils.response import Result
from middleware.auth import verify_token
from middleware.logger import log_operation

router = APIRouter(prefix='/api/log', tags=['操作日志'])


@router.post('/pageQuery')
@log_operation('分页查询操作日志')
async def page_query(request: Request, user: dict = Depends(verify_token)):
    data = await request.json()
    return Result.success(LogService.page_query(data))


@router.get('/listAll')
async def list_all(user: dict = Depends(verify_token)):
    return Result.success(LogService.list_all())


@router.get('/getById/{log_id}')
async def get_by_id(log_id: int, user: dict = Depends(verify_token)):
    return Result.success(LogService.get_by_id(log_id))


@router.delete('/deleteById/{log_id}')
@log_operation('删除操作日志')
async def delete_by_id(log_id: int, request: Request, user: dict = Depends(verify_token)):
    LogService.delete_by_id(log_id)
    return Result.success(None, '删除成功')


@router.delete('/deleteBatch')
@log_operation('批量删除操作日志')
async def delete_batch(request: Request, user: dict = Depends(verify_token)):
    ids = await request.json()
    LogService.delete_batch(ids)
    return Result.success(None, '批量删除成功')
