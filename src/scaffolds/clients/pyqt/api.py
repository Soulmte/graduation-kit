"""HTTP 请求封装(基于 requests)"""
import json
import requests
from config import BASE_URL


class ApiError(Exception):
    """业务异常"""
    def __init__(self, code, message):
        self.code = code
        self.message = message
        super().__init__(message)


class Session:
    """全局会话, 持有 token 和当前用户"""

    def __init__(self):
        self.token = ''
        self.user_info = None

    def login(self, token, user_info):
        self.token = token
        self.user_info = user_info

    def logout(self):
        self.token = ''
        self.user_info = None

    @property
    def is_logged_in(self):
        return bool(self.token)

    @property
    def is_admin(self):
        return self.user_info and self.user_info.get('role') == 'admin'


# 单例
session = Session()


def _request(method, path, json_data=None, params=None, files=None, timeout=10):
    """通用请求"""
    headers = {}
    if session.token:
        headers['Authorization'] = f'Bearer {session.token}'

    url = BASE_URL + path
    try:
        if files:
            # 上传文件不带 Content-Type, 让 requests 自动添加 boundary
            resp = requests.request(method, url, headers=headers, data=json_data,
                                    params=params, files=files, timeout=timeout)
        else:
            resp = requests.request(method, url, headers=headers, json=json_data,
                                    params=params, timeout=timeout)
        body = resp.json()
    except requests.RequestException as e:
        raise ApiError(-1, f'网络错误: {e}')
    except ValueError:
        raise ApiError(-1, '响应格式错误')

    code = body.get('code')
    if code == 200:
        return body
    elif code == 401:
        session.logout()
        raise ApiError(401, '登录已过期, 请重新登录')
    else:
        raise ApiError(code, body.get('message') or '请求失败')


# ---------- 用户 ----------
def login(username, password):
    return _request('POST', '/user/login', {'username': username, 'password': password})


def register(data):
    return _request('POST', '/user/register', data)


def page_query_user(query):
    return _request('POST', '/user/pageQuery', query)


def list_all_user():
    return _request('GET', '/user/listAll')


def get_user_by_id(uid):
    return _request('GET', f'/user/getById/{uid}')


def update_user(data):
    return _request('PUT', '/user/update', data)


def delete_user(uid):
    return _request('DELETE', f'/user/deleteById/{uid}')


def delete_user_batch(ids):
    return _request('DELETE', '/user/deleteBatch', ids)


# ---------- 公告 ----------
def page_query_notice(query):
    return _request('POST', '/notice/pageQuery', query)


def list_all_notice():
    return _request('GET', '/notice/listAll')


def get_notice_by_id(nid):
    return _request('GET', f'/notice/getById/{nid}')


def add_notice(data):
    return _request('POST', '/notice/add', data)


def update_notice(data):
    return _request('PUT', '/notice/update', data)


def delete_notice(nid):
    return _request('DELETE', f'/notice/deleteById/{nid}')


def delete_notice_batch(ids):
    return _request('DELETE', '/notice/deleteBatch', ids)


# ---------- 日志 ----------
def page_query_log(query):
    return _request('POST', '/log/pageQuery', query)


def delete_log(lid):
    return _request('DELETE', f'/log/deleteById/{lid}')


def delete_log_batch(ids):
    return _request('DELETE', '/log/deleteBatch', ids)


# ---------- 文件 ----------
def upload_file(file_path):
    """上传文件, 返回 {fileName, url}"""
    with open(file_path, 'rb') as f:
        return _request('POST', '/file/upload', files={'file': f})


# ---------- 健康检查 ----------
def health():
    return _request('GET', '/health')
