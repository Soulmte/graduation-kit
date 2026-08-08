"""主窗口 - 侧栏导航 + 内容区"""
from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QHBoxLayout, QVBoxLayout, QFrame, QLabel,
    QListWidget, QListWidgetItem, QStackedWidget, QPushButton, QMessageBox
)
import api
from config import APP_NAME
from views.notice_page import NoticePage
from views.user_manage_page import UserManagePage
from views.profile_page import ProfilePage
from views.system_status_page import SystemStatusPage


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle(APP_NAME)
        self.resize(1200, 750)
        self._build()

    def _build(self):
        central = QWidget()
        self.setCentralWidget(central)
        root = QHBoxLayout(central)
        root.setContentsMargins(0, 0, 0, 0)
        root.setSpacing(0)

        # 侧栏
        sidebar = QWidget()
        sidebar.setFixedWidth(220)
        side_layout = QVBoxLayout(sidebar)
        side_layout.setContentsMargins(0, 0, 0, 0)
        side_layout.setSpacing(0)

        # Logo
        logo_frame = QFrame()
        logo_frame.setFixedHeight(64)
        logo_frame.setStyleSheet(
            'border-bottom:1px solid #f0f0f0;background:#ffffff'
        )
        logo_layout = QHBoxLayout(logo_frame)
        logo_layout.setContentsMargins(24, 0, 24, 0)
        mark = QLabel('S')
        mark.setObjectName('logoMark')
        text = QLabel('脚手架平台')
        text.setObjectName('logoText')
        logo_layout.addWidget(mark)
        logo_layout.addWidget(text)
        logo_layout.addStretch()
        side_layout.addWidget(logo_frame)

        # 菜单
        self.menu_list = QListWidget()
        self.menu_list.setObjectName('sidebar')
        self._build_menu()
        side_layout.addWidget(self.menu_list, 1)

        # 退出按钮
        bottom = QFrame()
        bottom.setStyleSheet('background:#ffffff;border-top:1px solid #f0f0f0')
        bottom_layout = QVBoxLayout(bottom)
        bottom_layout.setContentsMargins(16, 12, 16, 12)
        u = api.session.user_info or {}
        user_label = QLabel(f"  {u.get('nickname') or u.get('username', '未登录')}")
        user_label.setStyleSheet('font-weight:500;padding:6px 0')
        btn_logout = QPushButton('退出登录')
        btn_logout.setObjectName('danger')
        btn_logout.clicked.connect(self.on_logout)
        bottom_layout.addWidget(user_label)
        bottom_layout.addWidget(btn_logout)
        side_layout.addWidget(bottom)

        root.addWidget(sidebar)

        # 内容区
        right = QWidget()
        right_layout = QVBoxLayout(right)
        right_layout.setContentsMargins(0, 0, 0, 0)
        right_layout.setSpacing(0)

        # 顶栏
        topbar = QFrame()
        topbar.setObjectName('topbar')
        topbar.setFixedHeight(64)
        top_layout = QHBoxLayout(topbar)
        top_layout.setContentsMargins(24, 0, 24, 0)
        title = QLabel('管理控制台')
        title.setStyleSheet('font-size:15px;color:#595959;font-weight:500')
        top_layout.addWidget(title)
        top_layout.addStretch()
        role_label = QLabel(f"  {'管理员' if api.session.is_admin else '普通用户'}  ")
        role_label.setObjectName('tagAdmin' if api.session.is_admin else 'tagUser')
        top_layout.addWidget(role_label)
        right_layout.addWidget(topbar)

        # 内容栈
        self.stack = QStackedWidget()
        self.stack.setStyleSheet('background:#f5f7fa')
        right_layout.addWidget(self.stack, 1)

        root.addWidget(right, 1)

        # 创建页面
        self._create_pages()

        # 默认选中第一项
        self.menu_list.setCurrentRow(0)

    def _build_menu(self):
        u = api.session.user_info or {}
        is_admin = u.get('role') == 'admin'

        items = [('公告', 'notice'), ('个人中心', 'profile')]
        if is_admin:
            items.insert(0, ('用户管理', 'users'))
            items.append(('系统状态', 'status'))

        for label, key in items:
            item = QListWidgetItem(label)
            item.setData(Qt.ItemDataRole.UserRole, key)
            self.menu_list.addItem(item)

        self.menu_list.currentItemChanged.connect(self.on_menu_change)

    def _create_pages(self):
        self.pages = {}
        self.pages['notice'] = NoticePage()
        self.pages['profile'] = ProfilePage()
        if api.session.is_admin:
            self.pages['users'] = UserManagePage()
            self.pages['status'] = SystemStatusPage()

        # 添加到 stack 时记录索引
        self.page_indexes = {}
        for key in ['users', 'notice', 'profile', 'status']:
            if key in self.pages:
                idx = self.stack.addWidget(self.pages[key])
                self.page_indexes[key] = idx

    def on_menu_change(self, current, _previous):
        if not current:
            return
        key = current.data(Qt.ItemDataRole.UserRole)
        if key in self.page_indexes:
            self.stack.setCurrentIndex(self.page_indexes[key])

    def on_logout(self):
        ret = QMessageBox.question(self, '提示', '确定要退出登录吗?',
                                   QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No)
        if ret == QMessageBox.StandardButton.Yes:
            api.session.logout()
            self.close()
            # 重新打开登录窗口
            from views.login_window import LoginWindow
            from PyQt6.QtWidgets import QApplication
            login = LoginWindow()
            if login.exec():
                new_main = MainWindow()
                new_main.show()
                # 把新窗口塞给 QApplication 防止被 GC
                QApplication.instance()._main_window = new_main
