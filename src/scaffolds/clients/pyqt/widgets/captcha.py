"""图形验证码控件 (纯前端, 不走后端)"""
import random
import string
from PyQt6.QtCore import Qt, QSize
from PyQt6.QtGui import QPainter, QPen, QColor, QFont
from PyQt6.QtWidgets import QWidget


CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'


class CaptchaWidget(QWidget):
    """4 位字符验证码, 点击刷新"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setToolTip('点击刷新验证码')
        self._code = ''
        self.refresh()

    def sizeHint(self):
        return QSize(110, 36)

    def refresh(self):
        self._code = ''.join(random.choice(CHARS) for _ in range(4))
        self.update()

    def verify(self, text):
        return (text or '').upper() == self._code.upper()

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.refresh()

    def paintEvent(self, event):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        w, h = self.width(), self.height()

        # 背景
        p.fillRect(0, 0, w, h, QColor('#f5f7fa'))

        # 干扰线
        for _ in range(3):
            p.setPen(QPen(self._random_color(), 1))
            p.drawLine(random.randint(0, w), random.randint(0, h),
                       random.randint(0, w), random.randint(0, h))

        # 干扰点
        for _ in range(30):
            p.setPen(QPen(self._random_color(), 1))
            p.drawPoint(random.randint(0, w), random.randint(0, h))

        # 字符
        char_width = w / (len(self._code) + 0.5)
        for i, ch in enumerate(self._code):
            p.save()
            font = QFont('Arial', 14, QFont.Weight.Bold)
            p.setFont(font)
            p.setPen(self._random_color())
            x = char_width * (i + 0.5)
            y = h / 2 + random.uniform(-3, 3)
            p.translate(x, y)
            p.rotate(random.uniform(-20, 20))
            p.drawText(-8, 6, ch)
            p.restore()

        # 边框
        p.setPen(QPen(QColor('#d9d9d9'), 1))
        p.drawRoundedRect(0, 0, w - 1, h - 1, 4, 4)

    @staticmethod
    def _random_color():
        return QColor(random.randint(30, 150), random.randint(30, 150), random.randint(30, 150))
