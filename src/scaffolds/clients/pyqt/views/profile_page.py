"""个人中心页"""
import re
from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QSpinBox,
    QComboBox, QPushButton, QFormLayout, QFrame, QFileDialog, QMessageBox
)
from PyQt6.QtGui import QPixmap
import requests
import api
from config import STATIC_BASE


class ProfilePage(QWidget):
    def __init__(self):
        super().__init__()
        self._build()
        self.load()

    def _build(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(16)

        title = QLabel('个人信息')
        title.setObjectName('pageTitle')
        layout.addWidget(title)

        # 头像区
        avatar_card = QFrame()
        avatar_card.setObjectName('card')
        av = QVBoxLayout(avatar_card)
        av.setContentsMargins(24, 24, 24, 24)
        av.setSpacing(8)

        self.avatar_label = QLabel('头像')
        self.avatar_label.setFixedSize(100, 100)
        self.avatar_label.setStyleSheet(
            'border-radius:50px;background:#f5f7fa;border:1px solid #f0f0f0;'
        )
        self.avatar_label.setAlignment(Qt.AlignmentFlag.AlignCenter)

        btn_upload = QPushButton('上传头像')
        btn_upload.setObjectName('secondary')
        btn_upload.clicked.connect(self.choose_avatar)

        av_row = QHBoxLayout()
        av_row.addStretch()
        av_row.addWidget(self.avatar_label)
        av_row.addStretch()
        av.addLayout(av_row)

        btn_row = QHBoxLayout()
        btn_row.addStretch()
        btn_row.addWidget(btn_upload)
        btn_row.addStretch()
        av.addLayout(btn_row)

        tip = QLabel('支持 JPG / PNG / GIF / WEBP · 单张 ≤ 2 MB')
        tip.setObjectName('textMute')
        tip.setAlignment(Qt.AlignmentFlag.AlignCenter)
        tip.setStyleSheet('color:#8c8c8c')
        av.addWidget(tip)

        layout.addWidget(avatar_card)

        # 表单
        form_card = QFrame()
        form_card.setObjectName('card')
        form = QFormLayout(form_card)
        form.setContentsMargins(24, 24, 24, 24)
        form.setSpacing(12)

        self.username = QLineEdit()
        self.username.setEnabled(False)
        self.username.setMinimumHeight(34)

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

        self.password = QLineEdit()
        self.password.setMinimumHeight(34)
        self.password.setEchoMode(QLineEdit.EchoMode.Password)
        self.password.setPlaceholderText('留空表示不修改')

        form.addRow('用户名:', self.username)
        form.addRow('昵称:', self.nickname)
        form.addRow('年龄:', self.age)
        form.addRow('性别:', self.gender)
        form.addRow('手机号:', self.phone)
        form.addRow('邮箱:', self.email)
        form.addRow('新密码:', self.password)

        btn_save = QPushButton('保存')
        btn_save.setObjectName('primary')
        btn_save.setMinimumHeight(36)
        btn_save.clicked.connect(self.save)
        form.addRow('', btn_save)

        layout.addWidget(form_card)
        layout.addStretch()

        # 当前头像 url
        self._avatar_url = ''

    def load(self):
        u = api.session.user_info or {}
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
        self._avatar_url = u.get('avatar') or ''
        self._render_avatar()

    def _render_avatar(self):
        if not self._avatar_url:
            self.avatar_label.setText('未上传')
            self.avatar_label.setPixmap(QPixmap())
            return
        try:
            url = self._avatar_url
            if url.startswith('/'):
                url = STATIC_BASE + url
            resp = requests.get(url, timeout=5)
            pix = QPixmap()
            pix.loadFromData(resp.content)
            self.avatar_label.setPixmap(
                pix.scaled(100, 100, Qt.AspectRatioMode.KeepAspectRatioByExpanding,
                           Qt.TransformationMode.SmoothTransformation)
            )
        except Exception:
            self.avatar_label.setText('加载失败')

    def choose_avatar(self):
        file_path, _ = QFileDialog.getOpenFileName(
            self, '选择头像', '', '图片 (*.jpg *.jpeg *.png *.gif *.webp)')
        if not file_path:
            return
        try:
            res = api.upload_file(file_path)
            self._avatar_url = res['data']['url']
            self._render_avatar()
            QMessageBox.information(self, '提示', '头像上传成功')
        except api.ApiError as e:
            QMessageBox.warning(self, '提示', e.message)

    def save(self):
        phone = self.phone.text().strip()
        email = self.email.text().strip()
        password = self.password.text()

        if phone and not re.match(r'^1[3-9]\d{9}$', phone):
            return QMessageBox.warning(self, '提示', '手机号格式不正确')
        if email and not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            return QMessageBox.warning(self, '提示', '邮箱格式不正确')
        if password and (len(password) < 6 or len(password) > 32):
            return QMessageBox.warning(self, '提示', '密码长度 6-32 位')

        u = api.session.user_info
        data = {
            'id': u['id'],
            'username': u['username'],
            'nickname': self.nickname.text().strip(),
            'age': self.age.value() if self.age.value() > 0 else None,
            'gender': self.gender.currentData() or '',
            'phone': phone,
            'email': email,
            'avatar': self._avatar_url,
            'role': u.get('role', 'user')
        }
        if password:
            data['password'] = password

        try:
            api.update_user(data)
            # 更新本地缓存
            api.session.user_info = {**u, **data, 'password': None}
            QMessageBox.information(self, '提示', '保存成功')
        except api.ApiError as e:
            QMessageBox.warning(self, '提示', e.message)
