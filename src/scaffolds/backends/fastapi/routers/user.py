"""用户控制器"""
from fastapi import APIRouter, Depends, Request
from services.user_service import UserService
from utils.response import Result
from middleware.auth import verify_token
from middleware.logger import log_operation

router = APIRouter(prefix='/api/user', tags=['用户'])


@router.post('/register')
@log_operation('用户注册')
async def register(request: Request):
    data = await request.json()
    UserService.register(data)
    return Result.success(None, '注册成功')


@router.post('/login')
@log_operation('用户登录')
async def login(request: Request):
    data = await request.json()
    result = UserService.login(data.get('username', ''), data.get('password', ''))
    return Result.success(result, '登录成功')


@router.post('/pageQuery')
@log_operation('分页查询用户')
async def page_query(request: Request, user: dict = Depends(verify_token)):
    data = await request.json()
    return Result.success(UserService.page_query(data))


@router.get('/listAll')
@log_operation('查询用户列表')
async def list_all(request: Request, user: dict = Depends(verify_token)):
    return Result.success(UserService.list_all())


@router.get('/getById/{user_id}')
@log_operation('查询用户详情')
async def get_by_id(user_id: int, request: Request, user: dict = Depends(verify_token)):
    return Result.success(UserService.get_by_id(user_id))


@router.put('/update')
@log_operation('更新用户信息')
async def update(request: Request, user: dict = Depends(verify_token)):
    data = await request.json()
    UserService.update(data)
    return Result.success(None, '更新成功')


@router.delete('/deleteById/{user_id}')
@log_operation('删除用户')
async def delete_by_id(user_id: int, request: Request, user: dict = Depends(verify_token)):
    UserService.delete_by_id(user_id)
    return Result.success(None, '删除成功')


@router.delete('/deleteBatch')
@log_operation('批量删除用户')
async def delete_batch(request: Request, user: dict = Depends(verify_token)):
    ids = await request.json()
    UserService.delete_batch(ids)
    return Result.success(None, '批量删除成功')
