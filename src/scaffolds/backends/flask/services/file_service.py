"""文件服务"""
import os
import uuid
from datetime import datetime
from config import Config
from services.user_service import BizError


class FileService:

    @staticmethod
    def upload(file):
        """上传单个文件"""
        _validate(file)
        url = _save(file)
        return {'url': url, 'fileName': file.filename}

    @staticmethod
    def upload_batch(files):
        """批量上传文件"""
        if not files:
            raise BizError(400, '请选择要上传的文件')

        success, fail = [], []
        for f in files:
            try:
                _validate(f)
                url = _save(f)
                success.append({'fileName': f.filename, 'url': url})
            except Exception as e:
                fail.append(f'{f.filename}: {str(e)}')

        return {
            'success': success, 'fail': fail,
            'total': len(files), 'successCount': len(success), 'failCount': len(fail)
        }

    @staticmethod
    def delete(file_name):
        """删除文件"""
        if not file_name:
            raise BizError(400, '文件名不能为空')
        relative_path = file_name.replace('/uploads/', '')
        base_path = os.path.realpath(Config.UPLOAD_DIR)
        absolute_path = os.path.realpath(os.path.join(base_path, relative_path))
        if not absolute_path.startswith(base_path + os.sep) and absolute_path != base_path:
            raise BizError(400, '非法的文件路径')
        if os.path.exists(absolute_path):
            os.remove(absolute_path)


def _validate(file):
    if not file or not file.filename:
        raise BizError(400, '文件不能为空')
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in Config.ALLOWED_EXTENSIONS:
        raise BizError(400, f'不支持的文件类型: .{ext}')


def _save(file) -> str:
    ext = file.filename.rsplit('.', 1)[-1].lower()
    new_name = f'{uuid.uuid4().hex}.{ext}'
    date_dir = datetime.now().strftime('%Y-%m-%d')
    dir_path = os.path.join(Config.UPLOAD_DIR, date_dir)
    os.makedirs(dir_path, exist_ok=True)

    file_path = os.path.join(dir_path, new_name)
    file.save(file_path)
    return f'/uploads/{date_dir}/{new_name}'
