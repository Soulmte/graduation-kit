"""系统状态页 - 调用 /api/health 显示后端连通性"""
import time
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QFormLayout, QFrame
)
import api


class SystemStatusPage(QWidget):
    def __init__(self):
        super().__init__()
        self._build()
        self.refresh()

    def _build(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(16)

        # 标题 + 刷新按钮
        head = QHBoxLayout()
        title = QLabel('系统状态')
        title.setObjectName('pageTitle')
        head.addWidget(title)
        head.addStretch()
        btn_refresh = QPushButton('刷新')
        btn_refresh.setObjectName('primary')
        btn_refresh.clicked.connect(self.refresh)
        head.addWidget(btn_refresh)
        layout.addLayout(head)

        # 状态卡片
        card = QFrame()
        card.setObjectName('card')
        form = QFormLayout(card)
        form.setContentsMargins(24, 24, 24, 24)
        form.setSpacing(16)

        self.status_label = QLabel('-')
        self.service_label = QLabel('-')
        self.db_label = QLabel('-')
        self.latency_label = QLabel('-')
        self.url_label = QLabel('/api/health')

        form.addRow('连接状态:', self.status_label)
        form.addRow('后端技术栈:', self.service_label)
        form.addRow('数据库状态:', self.db_label)
        form.addRow('响应耗时:', self.latency_label)
        form.addRow('API 地址:', self.url_label)

        layout.addWidget(card)

        # 提示
        tip = QLabel(
            '提示: 修改 config.py 中的 BASE_URL 切换后端\n'
            '  Spring Boot → :8080  /  Express → :8081  /  Flask → :8082\n'
            '  FastAPI → :8083      /  Go + Gin → :8084 /  .NET → :8085'
        )
        tip.setObjectName('textMute')
        tip.setStyleSheet('color:#8c8c8c;line-height:1.8')
        layout.addWidget(tip)
        layout.addStretch()

    def refresh(self):
        start = time.time()
        try:
            res = api.health()
            latency = int((time.time() - start) * 1000)
            data = res.get('data', {})
            self.status_label.setText('✓ 正常')
            self.status_label.setStyleSheet('color:#52c41a;font-weight:600')
            self.service_label.setText(data.get('service') or '未知')
            db = data.get('database', '')
            self.db_label.setText('✓ 连接正常' if db == 'ok' else f'✗ {db}')
            self.db_label.setStyleSheet(
                'color:#52c41a' if db == 'ok' else 'color:#ff4d4f'
            )
            self.latency_label.setText(f'{latency} ms')
        except api.ApiError as e:
            latency = int((time.time() - start) * 1000)
            self.status_label.setText('✗ 连接失败')
            self.status_label.setStyleSheet('color:#ff4d4f;font-weight:600')
            self.service_label.setText('-')
            self.db_label.setText(e.message)
            self.db_label.setStyleSheet('color:#ff4d4f')
            self.latency_label.setText(f'{latency} ms')
