"""登录窗口"""
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QPainter, QLinearGradient, QColor
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QFrame, QMessageBox, QWidget
)
import api
from widgets.captcha import CaptchaWidget


class LoginWindow(QDialog):
    """登录对话框, 登录成功后 emit success 信号关闭窗口"""

    success = pyqtSignal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle('登录')
        self.setFixedSize(420, 480)
        self.setObjectName('loginWindow')
        self._build()

    def _build(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(40, 40, 40, 40)
        layout.setSpacing(16)

        # 品牌区
        brand = QHBoxLayout()
        brand.addStretch()
        mark = QLabel('S')
        mark.setObjectName('logoMark')
        brand.addWidget(mark)
        brand.addStretch()
        layout.addLayout(brand)

        title = QLabel('欢迎登录')
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title.setStyleSheet('font-size:20px;font-weight:600;margin-top:8px')
        layout.addWidget(title)

        sub = QLabel('多技术栈脚手架 · 桌面端')
        sub.setAlignment(Qt.AlignmentFlag.AlignCenter)
        sub.setObjectName('textMute')
        layout.addWidget(sub)
        layout.addSpacing(20)

        # 用户名
        self.username = QLineEdit()
        self.username.setPlaceholderText('用户名')
        self.username.setMinimumHeight(36)
        layout.addWidget(self.username)

        # 密码
        self.password = QLineEdit()
        self.password.setPlaceholderText('密码')
        self.password.setMinimumHeight(36)
        self.password.setEchoMode(QLineEdit.EchoMode.Password)
        layout.addWidget(self.password)

        # 验证码行
        captcha_row = QHBoxLayout()
        captcha_row.setSpacing(8)
        self.captcha_input = QLineEdit()
        self.captcha_input.setPlaceholderText('验证码')
        self.captcha_input.setMinimumHeight(36)
        self.captcha_input.setMaxLength(4)
        self.captcha_widget = CaptchaWidget()
        self.captcha_widget.setFixedSize(110, 36)
        captcha_row.addWidget(self.captcha_input, 1)
        captcha_row.addWidget(self.captcha_widget)
        layout.addLayout(captcha_row)

        layout.addSpacing(8)

        # 登录按钮
        self.btn_login = QPushButton('登录')
        self.btn_login.setObjectName('primary')
        self.btn_login.setMinimumHeight(40)
        self.btn_login.clicked.connect(self._do_login)
        layout.addWidget(self.btn_login)

        # 注册链接
        layout.addSpacing(8)
        footer = QHBoxLayout()
        footer.addStretch()
        tip = QLabel('还没有账号?')
        tip.setObjectName('textMute')
        footer.addWidget(tip)
        link = QPushButton('立即注册')
        link.setObjectName('link')
        link.setCursor(Qt.CursorShape.PointingHandCursor)
        link.clicked.connect(self._open_register)
        footer.addWidget(link)
        footer.addStretch()
        layout.addLayout(footer)

        # 回车登录
        self.password.returnPressed.connect(self._do_login)
        self.captcha_input.returnPressed.connect(self._do_login)

    def _do_login(self):
        username = self.username.text().strip()
        password = self.password.text()
        captcha = self.captcha_input.text().strip()

        if not username:
            QMessageBox.warning(self, '提示', '请输入用户名')
            return
        if not password:
            QMessageBox.warning(self, '提示', '请输入密码')
            return
        if not captcha:
            QMessageBox.warning(self, '提示', '请输入验证码')
            return
        if not self.captcha_widget.verify(captcha):
            QMessageBox.warning(self, '提示', '验证码错误')
            self.captcha_widget.refresh()
            self.captcha_input.clear()
            return

        try:
            self.btn_login.setEnabled(False)
            self.btn_login.setText('登录中...')
            res = api.login(username, password)
            api.session.login(res['data']['token'], res['data']['userInfo'])
            self.success.emit()
            self.accept()
        except api.ApiError as e:
            QMessageBox.warning(self, '登录失败', e.message)
            self.captcha_widget.refresh()
            self.captcha_input.clear()
        finally:
            self.btn_login.setEnabled(True)
            self.btn_login.setText('登录')

    def _open_register(self):
        from views.register_window import RegisterWindow
        w = RegisterWindow(self)
        w.exec()


class LoginScreen(QWidget):
    """带渐变背景的登录页(用于全屏模式)"""

    def paintEvent(self, event):
        p = QPainter(self)
        gradient = QLinearGradient(0, 0, self.width(), self.height())
        gradient.setColorAt(0, QColor('#e6f4ff'))
        gradient.setColorAt(1, QColor('#f5f7fa'))
        p.fillRect(self.rect(), gradient)
