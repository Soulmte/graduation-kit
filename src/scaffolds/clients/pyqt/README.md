# PyQt6 桌面客户端

基于 PyQt6 构建的多技术栈脚手架桌面端,接入同一套后端 API。

## 启动

```bash
cd clients/pyqt
pip install -r requirements.txt
python main.py
```

## 切换后端

修改 `config.py` 里的 `BASE_URL` 即可:

```python
BASE_URL = 'http://localhost:8084/api'  # Go
# BASE_URL = 'http://localhost:8080/api'  # Spring Boot
# BASE_URL = 'http://localhost:8085/api'  # .NET
```

## 项目结构

```
clients/pyqt/
├── main.py                    # 入口
├── config.py                  # 配置
├── api.py                     # HTTP 请求封装 + Session
├── styles.py                  # QSS 样式表
├── widgets/
│   └── captcha.py             # 验证码控件
├── views/
│   ├── login_window.py        # 登录窗口
│   ├── register_window.py     # 注册窗口
│   ├── main_window.py         # 主窗口(侧栏 + 内容栈)
│   ├── notice_page.py         # 公告列表 + 详情
│   ├── user_manage_page.py    # 用户管理(管理员)
│   ├── user_form_dialog.py    # 用户增/改表单
│   ├── profile_page.py        # 个人中心(头像上传)
│   └── system_status_page.py  # 系统状态(/api/health)
└── requirements.txt
```

## 功能

- 登录(带前端图形验证码)/ 注册(完整字段校验)
- 公告列表 + 双击查看详情(渲染 HTML 富文本)
- 用户管理(管理员):分页、搜索、增删改、角色筛选
- 个人中心:头像上传、字段编辑、修改密码
- 系统状态:展示当前连接的后端、数据库状态、响应耗时

## 默认账号

- admin / 123456 (管理员)
- user / 123456 (普通用户)
