"""用户管理页 (管理员视角)"""
from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QComboBox,
    QPushButton, QTableWidget, QTableWidgetItem, QMessageBox, QHeaderView
)
import api
from views.user_form_dialog import UserFormDialog


GENDER_LABEL = {'male': '男', 'female': '女', 'other': '其他'}


class UserManagePage(QWidget):
    def __init__(self):
        super().__init__()
        self.page_num = 1
        self.page_size = 10
        self.total = 0
        self._build()
        self.fetch()

    def _build(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(12)

        # 标题 + 添加按钮
        head = QHBoxLayout()
        title = QLabel('用户管理')
        title.setObjectName('pageTitle')
        head.addWidget(title)
        head.addStretch()
        btn_add = QPushButton('+ 添加用户')
        btn_add.setObjectName('primary')
        btn_add.clicked.connect(self.on_add)
        head.addWidget(btn_add)
        layout.addLayout(head)

        # 工具栏
        toolbar = QHBoxLayout()
        toolbar.setSpacing(12)
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText('搜索用户名')
        self.search_input.setMaximumWidth(220)
        self.search_input.returnPressed.connect(self.on_filter)
        self.role_select = QComboBox()
        self.role_select.addItems(['全部角色', '管理员', '普通用户'])
        self.role_select.setMaximumWidth(150)
        btn_search = QPushButton('搜索')
        btn_search.setObjectName('primary')
        btn_search.clicked.connect(self.on_filter)
        toolbar.addWidget(self.search_input)
        toolbar.addWidget(self.role_select)
        toolbar.addWidget(btn_search)
        toolbar.addStretch()
        layout.addLayout(toolbar)

        # 表格
        self.table = QTableWidget()
        headers = ['ID', '用户名', '昵称', '性别', '年龄', '手机号', '邮箱', '角色', '创建时间', '操作']
        self.table.setColumnCount(len(headers))
        self.table.setHorizontalHeaderLabels(headers)
        self.table.verticalHeader().setVisible(False)
        self.table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        h = self.table.horizontalHeader()
        h.setSectionResizeMode(QHeaderView.ResizeMode.Interactive)
        h.setSectionResizeMode(6, QHeaderView.ResizeMode.Stretch)  # 邮箱列拉伸
        layout.addWidget(self.table, 1)

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

    def on_filter(self):
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
        role = ''
        idx = self.role_select.currentIndex()
        if idx == 1: role = 'admin'
        elif idx == 2: role = 'user'

        try:
            res = api.page_query_user({
                'pageNum': self.page_num,
                'pageSize': self.page_size,
                'username': self.search_input.text().strip(),
                'role': role
            })
            self._fill_table(res['data']['records'])
            self.total = res['data']['total']
            self.page_info.setText(f'共 {self.total} 条 · 第 {self.page_num} 页')
        except api.ApiError as e:
            QMessageBox.warning(self, '提示', e.message)

    def _fill_table(self, records):
        self.table.setRowCount(len(records))
        for row, u in enumerate(records):
            self.table.setItem(row, 0, QTableWidgetItem(str(u.get('id', ''))))
            self.table.setItem(row, 1, QTableWidgetItem(u.get('username', '')))
            self.table.setItem(row, 2, QTableWidgetItem(u.get('nickname') or '-'))
            self.table.setItem(row, 3, QTableWidgetItem(GENDER_LABEL.get(u.get('gender'), '-')))
            self.table.setItem(row, 4, QTableWidgetItem(str(u.get('age')) if u.get('age') else '-'))
            self.table.setItem(row, 5, QTableWidgetItem(u.get('phone') or '-'))
            self.table.setItem(row, 6, QTableWidgetItem(u.get('email') or '-'))
            role_text = '管理员' if u.get('role') == 'admin' else '普通用户'
            self.table.setItem(row, 7, QTableWidgetItem(role_text))
            self.table.setItem(row, 8, QTableWidgetItem(u.get('createTime') or '-'))

            # 操作列: 编辑 + 删除
            op_widget = QWidget()
            op_layout = QHBoxLayout(op_widget)
            op_layout.setContentsMargins(4, 4, 4, 4)
            op_layout.setSpacing(8)

            btn_edit = QPushButton('编辑')
            btn_edit.setObjectName('secondary')
            btn_edit.setFixedHeight(28)
            btn_edit.clicked.connect(lambda _, user=u: self.on_edit(user))

            btn_del = QPushButton('删除')
            btn_del.setObjectName('danger')
            btn_del.setFixedHeight(28)
            btn_del.clicked.connect(lambda _, uid=u['id']: self.on_delete(uid))

            op_layout.addWidget(btn_edit)
            op_layout.addWidget(btn_del)
            op_layout.addStretch()
            self.table.setCellWidget(row, 9, op_widget)

    def on_add(self):
        dlg = UserFormDialog(self)
        if dlg.exec():
            self.fetch()

    def on_edit(self, user):
        dlg = UserFormDialog(self, user=user)
        if dlg.exec():
            self.fetch()

    def on_delete(self, uid):
        ret = QMessageBox.question(self, '确认删除', '确定要删除这个用户吗?',
                                   QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No)
        if ret == QMessageBox.StandardButton.Yes:
            try:
                api.delete_user(uid)
                QMessageBox.information(self, '提示', '删除成功')
                self.fetch()
            except api.ApiError as e:
                QMessageBox.warning(self, '提示', e.message)
