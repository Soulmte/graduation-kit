"""用户添加 / 编辑表单"""
import re
from PyQt6.QtWidgets import (
    QDialog, QFormLayout, QLineEdit, QSpinBox, QComboBox, QPushButton,
    QHBoxLayout, QVBoxLayout, QMessageBox
)
import api


class UserFormDialog(QDialog):
    def __init__(self, parent=None, user=None):
        super().__init__(parent)
        self.user = user  # None 表示新增
        self.setWindowTitle('编辑用户' if user else '添加用户')
        self.setFixedSize(460, 540)
        self._build()
        if user:
            self._fill(user)

    def _build(self):
        v = QVBoxLayout(self)
        v.setContentsMargins(24, 24, 24, 24)
        v.setSpacing(12)

        form = QFormLayout()
        form.setSpacing(12)

        self.username = QLineEdit()
        self.username.setMinimumHeight(34)
        if self.user:
            self.username.setEnabled(False)

        self.password = QLineEdit()
        self.password.setMinimumHeight(34)
        self.password.setEchoMode(QLineEdit.EchoMode.Password)
        self.password.setPlaceholderText('编辑时留空表示不修改')

        self.nickname = QLineEdit()
        self.nickname.setMinimumHeight(34)
        self.nickname.setMaxLength(50)

        self.age = QSpinBox()
        self.age.setRange(0, 150)
        self.age.setMinimumHeight(34)

        self.gender = QComboBox()
        self.gender.addItem('未选择', '')
        self.gender.addItem('男', 'male')
        self.gender.addItem('女', 'female')
        self.gender.addItem('其他', 'other')
        self.gender.setMinimumHeight(34)

        self.phone = QLineEdit()
        self.phone.setMinimumHeight(34)
        self.phone.setMaxLength(11)

        self.email = QLineEdit()
        self.email.setMinimumHeight(34)

        self.role = QComboBox()
        self.role.addItem('普通用户', 'user')
        self.role.addItem('管理员', 'admin')
        self.role.setMinimumHeight(34)

        form.addRow('用户名:', self.username)
        form.addRow('密码:', self.password)
        form.addRow('昵称:', self.nickname)
        form.addRow('年龄:', self.age)
        form.addRow('性别:', self.gender)
        form.addRow('手机号:', self.phone)
        form.addRow('邮箱:', self.email)
        form.addRow('角色:', self.role)

        v.addLayout(form)
        v.addStretch()

        # 按钮行
        btn_row = QHBoxLayout()
        btn_row.addStretch()
        btn_cancel = QPushButton('取消')
        btn_cancel.setObjectName('secondary')
        btn_cancel.clicked.connect(self.reject)
        btn_ok = QPushButton('保存' if self.user else '添加')
        btn_ok.setObjectName('primary')
        btn_ok.clicked.connect(self._submit)
        btn_row.addWidget(btn_cancel)
        btn_row.addWidget(btn_ok)
        v.addLayout(btn_row)

    def _fill(self, u):
        self.username.setText(u.get('username', ''))
        self.nickname.setText(u.get('nickname') or '')
        self.age.setValue(u.get('age') or 0)
        gender = u.get('gender') or ''
        for i in range(self.gender.count()):
            if self.gender.itemData(i) == gender:
                self.gender.setCurrentIndex(i)
                break
        self.phone.setText(u.get('phone') or '')
        self.email.setText(u.get('email') or '')
        self.role.setCurrentIndex(0 if u.get('role') == 'user' else 1)

    def _submit(self):
        username = self.username.text().strip()
        password = self.password.text()
        nickname = self.nickname.text().strip()
        phone = self.phone.text().strip()
        email = self.email.text().strip()

        # 校验
        if not username:
            return self._warn('请输入用户名')
        if not self.user and not password:
            return self._warn('请输入密码')
        if password and (len(password) < 6 or len(password) > 32):
            return self._warn('密码长度 6-32 位')
        if phone and not re.match(r'^1[3-9]\d{9}$', phone):
            return self._warn('手机号格式不正确')
        if email and not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            return self._warn('邮箱格式不正确')

        data = {
            'username': username,
            'nickname': nickname,
            'age': self.age.value() if self.age.value() > 0 else None,
            'gender': self.gender.currentData() or '',
            'phone': phone,
            'email': email,
            'role': self.role.currentData()
        }
        if password:
            data['password'] = password

        try:
            if self.user:
                data['id'] = self.user['id']
                api.update_user(data)
                QMessageBox.information(self, '提示', '更新成功')
            else:
                api.register(data)
                QMessageBox.information(self, '提示', '添加成功')
            self.accept()
        except api.ApiError as e:
            self._warn(e.message)

    def _warn(self, msg):
        QMessageBox.warning(self, '提示', msg)
