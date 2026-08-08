"""注册窗口"""
import re
from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QGridLayout, QLabel,
    QLineEdit, QPushButton, QSpinBox, QComboBox, QMessageBox
)
import api


class RegisterWindow(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle('注册')
        self.setFixedSize(480, 620)
        self._build()

    def _build(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(40, 30, 40, 30)
        layout.setSpacing(12)

        # 标题
        mark = QLabel('S')
        mark.setObjectName('logoMark')
        mark.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title = QLabel('注册账号')
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title.setStyleSheet('font-size:20px;font-weight:600')
        head = QHBoxLayout()
        head.addStretch()
        head.addWidget(mark)
        head.addStretch()
        layout.addLayout(head)
        layout.addWidget(title)
        layout.addSpacing(12)

        # 用户名
        self.username = self._make_input('用户名 (登录使用)')
        layout.addWidget(self.username)

        # 密码
        self.password = self._make_input('密码', password=True)
        layout.addWidget(self.password)

        # 确认密码
        self.confirm = self._make_input('确认密码', password=True)
        layout.addWidget(self.confirm)

        # 昵称
        self.nickname = self._make_input('昵称 (选填)')
        self.nickname.setMaxLength(50)
        layout.addWidget(self.nickname)

        # 年龄 + 性别
        row = QHBoxLayout()
        row.setSpacing(12)
        self.age = QSpinBox()
        self.age.setRange(0, 150)
        self.age.setSpecialValueText('年龄 (选填)')
        self.age.setMinimumHeight(36)
        self.gender = QComboBox()
        self.gender.addItems(['性别 (选填)', '男', '女', '其他'])
        self.gender.setMinimumHeight(36)
        row.addWidget(self.age, 1)
        row.addWidget(self.gender, 1)
        layout.addLayout(row)

        # 手机号
        self.phone = self._make_input('手机号 (选填)')
        self.phone.setMaxLength(11)
        layout.addWidget(self.phone)

        # 邮箱
        self.email = self._make_input('邮箱 (选填)')
        layout.addWidget(self.email)

        layout.addSpacing(8)

        # 注册按钮
        self.btn_submit = QPushButton('注册')
        self.btn_submit.setObjectName('primary')
        self.btn_submit.setMinimumHeight(40)
        self.btn_submit.clicked.connect(self._do_register)
        layout.addWidget(self.btn_submit)

        # 返回登录
        footer = QHBoxLayout()
        footer.addStretch()
        tip = QLabel('已有账号?')
        tip.setObjectName('textMute')
        footer.addWidget(tip)
        link = QPushButton('立即登录')
        link.setObjectName('link')
        link.clicked.connect(self.reject)
        footer.addWidget(link)
        footer.addStretch()
        layout.addLayout(footer)

    def _make_input(self, placeholder, password=False):
        e = QLineEdit()
        e.setPlaceholderText(placeholder)
        e.setMinimumHeight(36)
        if password:
            e.setEchoMode(QLineEdit.EchoMode.Password)
        return e

    def _do_register(self):
        username = self.username.text().strip()
        password = self.password.text()
        confirm = self.confirm.text()
        nickname = self.nickname.text().strip()
        phone = self.phone.text().strip()
        email = self.email.text().strip()

        # 校验
        if not username:
            return self._warn('请输入用户名')
        if not re.match(r'^[a-zA-Z][a-zA-Z0-9_]{2,49}$', username):
            return self._warn('用户名 3-50 位, 字母开头, 仅字母数字下划线')
        if not password:
            return self._warn('请输入密码')
        if len(password) < 6 or len(password) > 32:
            return self._warn('密码长度 6-32 位')
        if password != confirm:
            return self._warn('两次密码不一致')
        if phone and not re.match(r'^1[3-9]\d{9}$', phone):
            return self._warn('手机号格式不正确')
        if email and not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            return self._warn('邮箱格式不正确')

        data = {
            'username': username,
            'password': password,
            'role': 'user'
        }
        if nickname: data['nickname'] = nickname
        if self.age.value() > 0: data['age'] = self.age.value()
        if self.gender.currentIndex() > 0:
            data['gender'] = ['male', 'female', 'other'][self.gender.currentIndex() - 1]
        if phone: data['phone'] = phone
        if email: data['email'] = email

        try:
            self.btn_submit.setEnabled(False)
            api.register(data)
            QMessageBox.information(self, '提示', '注册成功, 请登录')
            self.accept()
        except api.ApiError as e:
            self._warn(e.message)
        finally:
            self.btn_submit.setEnabled(True)

    def _warn(self, msg):
        QMessageBox.warning(self, '提示', msg)
