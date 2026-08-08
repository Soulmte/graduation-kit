"""公告列表页 (普通用户视角)"""
import re
from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QListWidget, QListWidgetItem, QMessageBox, QDialog, QTextBrowser,
    QFrame, QMessageBox
)
import api


def html_to_text(html):
    return re.sub(r'<[^>]+>', '', html or '').replace('&nbsp;', ' ').strip()


class NoticePage(QWidget):
    def __init__(self):
        super().__init__()
        self.page_num = 1
        self.page_size = 10
        self.title = ''
        self.total = 0
        self._build()
        self.fetch()

    def _build(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(16)

        title = QLabel('公告列表')
        title.setObjectName('pageTitle')
        layout.addWidget(title)

        # 搜索栏
        toolbar = QHBoxLayout()
        toolbar.setSpacing(12)
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText('搜索标题')
        self.search_input.setMaximumWidth(300)
        self.search_input.returnPressed.connect(self.on_search)
        btn_search = QPushButton('搜索')
        btn_search.setObjectName('primary')
        btn_search.clicked.connect(self.on_search)
        toolbar.addWidget(self.search_input)
        toolbar.addWidget(btn_search)
        toolbar.addStretch()
        layout.addLayout(toolbar)

        # 列表(用 QListWidget 展示)
        self.list_widget = QListWidget()
        self.list_widget.setStyleSheet('''
            QListWidget {
                background: #ffffff;
                border: 1px solid #f0f0f0;
                border-radius: 6px;
            }
            QListWidget::item {
                padding: 0;
                border-bottom: 1px solid #f0f0f0;
            }
            QListWidget::item:selected {
                background: #e6f4ff;
            }
        ''')
        self.list_widget.itemDoubleClicked.connect(self.on_view_detail)
        layout.addWidget(self.list_widget, 1)

        # 分页
        page_bar = QHBoxLayout()
        self.page_info = QLabel('共 0 条')
        self.page_info.setObjectName('textMute')
        self.btn_prev = QPushButton('上一页')
        self.btn_prev.setObjectName('secondary')
        self.btn_next = QPushButton('下一页')
        self.btn_next.setObjectName('secondary')
        self.btn_prev.clicked.connect(lambda: self.go_page(-1))
        self.btn_next.clicked.connect(lambda: self.go_page(1))
        page_bar.addWidget(self.page_info)
        page_bar.addStretch()
        page_bar.addWidget(self.btn_prev)
        page_bar.addWidget(self.btn_next)
        layout.addLayout(page_bar)

    def on_search(self):
        self.title = self.search_input.text().strip()
        self.page_num = 1
        self.fetch()

    def go_page(self, delta):
        new_page = self.page_num + delta
        if new_page < 1: return
        max_page = (self.total + self.page_size - 1) // self.page_size
        if max_page > 0 and new_page > max_page: return
        self.page_num = new_page
        self.fetch()

    def fetch(self):
        try:
            res = api.page_query_notice({
                'pageNum': self.page_num,
                'pageSize': self.page_size,
                'title': self.title
            })
            self.list_widget.clear()
            records = res['data']['records']
            self.total = res['data']['total']
            self.page_info.setText(f'共 {self.total} 条 · 第 {self.page_num} 页')
            for item in records:
                self._add_item(item)
        except api.ApiError as e:
            QMessageBox.warning(self, '提示', e.message)

    def _add_item(self, data):
        widget = QFrame()
        widget.setStyleSheet('background: transparent;')
        v = QVBoxLayout(widget)
        v.setContentsMargins(20, 16, 20, 16)
        v.setSpacing(6)

        title = QLabel(data.get('title', ''))
        title.setStyleSheet('font-size:15px;font-weight:600')
        content = QLabel(html_to_text(data.get('content', '')))
        content.setObjectName('textSub')
        content.setWordWrap(True)
        content.setMaximumHeight(48)
        time_label = QLabel(f"发布时间: {data.get('createTime', '-')}")
        time_label.setObjectName('textMute')
        time_label.setStyleSheet('color:#8c8c8c;font-size:12px')

        v.addWidget(title)
        v.addWidget(content)
        v.addWidget(time_label)

        item = QListWidgetItem()
        item.setSizeHint(widget.sizeHint())
        item.setData(Qt.ItemDataRole.UserRole, data)
        self.list_widget.addItem(item)
        self.list_widget.setItemWidget(item, widget)

    def on_view_detail(self, item):
        data = item.data(Qt.ItemDataRole.UserRole)
        try:
            res = api.get_notice_by_id(data['id'])
            self._show_detail(res['data'])
        except api.ApiError as e:
            QMessageBox.warning(self, '提示', e.message)

    def _show_detail(self, notice):
        dlg = QDialog(self)
        dlg.setWindowTitle('公告详情')
        dlg.resize(700, 500)
        layout = QVBoxLayout(dlg)
        layout.setContentsMargins(24, 24, 24, 24)

        title = QLabel(notice['title'])
        title.setStyleSheet('font-size:20px;font-weight:600')
        time_label = QLabel(f"发布时间: {notice.get('createTime', '-')}")
        time_label.setObjectName('textMute')
        time_label.setStyleSheet('color:#8c8c8c;border-bottom:1px solid #f0f0f0;padding-bottom:12px')

        browser = QTextBrowser()
        browser.setHtml(notice.get('content') or '')
        browser.setOpenExternalLinks(True)

        layout.addWidget(title)
        layout.addWidget(time_label)
        layout.addWidget(browser, 1)
        dlg.exec()
