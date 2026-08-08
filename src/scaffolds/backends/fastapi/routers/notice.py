"""公告控制器"""
from fastapi import APIRouter, Depends, Request
from services.notice_service import NoticeService
from utils.response import Result
from middleware.auth import verify_token
from middleware.logger import log_operation

router = APIRouter(prefix='/api/notice', tags=['公告'])


@router.post('/add')
@log_operation('创建公告')
async def add(request: Request, user: dict = Depends(verify_token)):
    data = await request.json()
    NoticeService.add(data)
    return Result.success(None, '创建成功')


@router.post('/pageQuery')
@log_operation('分页查询公告')
async def page_query(request: Request, user: dict = Depends(verify_token)):
    data = await request.json()
    return Result.success(NoticeService.page_query(data))


@router.get('/listAll')
@log_operation('查询公告列表')
async def list_all(request: Request, user: dict = Depends(verify_token)):
    return Result.success(NoticeService.list_all())


@router.get('/getById/{notice_id}')
@log_operation('查询公告详情')
async def get_by_id(notice_id: int, request: Request, user: dict = Depends(verify_token)):
    return Result.success(NoticeService.get_by_id(notice_id))


@router.put('/update')
@log_operation('更新公告')
async def update(request: Request, user: dict = Depends(verify_token)):
    data = await request.json()
    NoticeService.update(data)
    return Result.success(None, '更新成功')


@router.delete('/deleteById/{notice_id}')
@log_operation('删除公告')
async def delete_by_id(notice_id: int, request: Request, user: dict = Depends(verify_token)):
    NoticeService.delete_by_id(notice_id)
    return Result.success(None, '删除成功')


@router.delete('/deleteBatch')
@log_operation('批量删除公告')
async def delete_batch(request: Request, user: dict = Depends(verify_token)):
    ids = await request.json()
    NoticeService.delete_batch(ids)
    return Result.success(None, '批量删除成功')
