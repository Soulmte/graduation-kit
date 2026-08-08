"""全局 QSS 样式表"""
from config import PRIMARY_COLOR, PRIMARY_HOVER, PRIMARY_BG

QSS = f"""
* {{
    font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
    font-size: 13px;
    color: #262626;
}}

QMainWindow, QWidget {{
    background: #f5f7fa;
}}

/* 通用卡片 */
QFrame#card {{
    background: #ffffff;
    border: 1px solid #f0f0f0;
    border-radius: 6px;
}}

/* 主按钮 */
QPushButton#primary {{
    background: {PRIMARY_COLOR};
    color: #ffffff;
    border: none;
    border-radius: 4px;
    padding: 8px 20px;
    font-weight: 500;
}}
QPushButton#primary:hover {{ background: {PRIMARY_HOVER}; }}
QPushButton#primary:disabled {{ background: #bfbfbf; }}

/* 危险按钮 */
QPushButton#danger {{
    background: #ffffff;
    color: #ff4d4f;
    border: 1px solid #ff4d4f;
    border-radius: 4px;
    padding: 6px 16px;
}}
QPushButton#danger:hover {{
    background: #ff4d4f;
    color: #ffffff;
}}

/* 次要按钮 */
QPushButton#secondary {{
    background: #ffffff;
    color: {PRIMARY_COLOR};
    border: 1px solid {PRIMARY_COLOR};
    border-radius: 4px;
    padding: 6px 16px;
}}
QPushButton#secondary:hover {{
    background: {PRIMARY_COLOR};
    color: #ffffff;
}}

/* 文本按钮 */
QPushButton#link {{
    background: transparent;
    color: {PRIMARY_COLOR};
    border: none;
    text-decoration: underline;
}}

/* 输入框 */
QLineEdit, QTextEdit, QSpinBox, QComboBox {{
    background: #ffffff;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    padding: 6px 10px;
    selection-background-color: {PRIMARY_COLOR};
}}
QLineEdit:focus, QTextEdit:focus, QSpinBox:focus, QComboBox:focus {{
    border: 1px solid {PRIMARY_COLOR};
}}

/* 表格 */
QTableWidget {{
    background: #ffffff;
    border: 1px solid #f0f0f0;
    border-radius: 6px;
    gridline-color: #f0f0f0;
    selection-background-color: {PRIMARY_BG};
    selection-color: #262626;
}}
QHeaderView::section {{
    background: #fafafa;
    border: none;
    border-bottom: 1px solid #f0f0f0;
    padding: 8px;
    font-weight: 600;
}}
QTableWidget::item {{
    padding: 8px;
    border-bottom: 1px solid #f0f0f0;
}}

/* 侧栏 */
QListWidget#sidebar {{
    background: #ffffff;
    border: none;
    border-right: 1px solid #f0f0f0;
    padding: 8px 0;
    outline: none;
}}
QListWidget#sidebar::item {{
    padding: 12px 24px;
    border: none;
    margin: 2px 12px;
    border-radius: 4px;
}}
QListWidget#sidebar::item:hover {{
    background: #f5f7fa;
    color: {PRIMARY_COLOR};
}}
QListWidget#sidebar::item:selected {{
    background: {PRIMARY_BG};
    color: {PRIMARY_COLOR};
    font-weight: 500;
}}

/* 顶栏 */
QFrame#topbar {{
    background: #ffffff;
    border-bottom: 1px solid #f0f0f0;
}}

/* Logo 标志 */
QLabel#logoMark {{
    background: {PRIMARY_COLOR};
    color: #ffffff;
    font-weight: 700;
    font-size: 16px;
    border-radius: 4px;
    min-width: 32px;
    max-width: 32px;
    min-height: 32px;
    max-height: 32px;
    qproperty-alignment: AlignCenter;
}}
QLabel#logoText {{
    font-weight: 700;
    font-size: 16px;
    margin-left: 8px;
}}

/* 标题 */
QLabel#pageTitle {{
    font-size: 18px;
    font-weight: 600;
    color: #262626;
}}

/* 文字辅助类 */
QLabel#textMute {{ color: #8c8c8c; }}
QLabel#textSub  {{ color: #595959; }}

/* 标签 */
QLabel#tagAdmin {{
    background: #fff1f0;
    color: #cf1322;
    border: 1px solid #ffa39e;
    border-radius: 2px;
    padding: 2px 8px;
}}
QLabel#tagUser {{
    background: {PRIMARY_BG};
    color: {PRIMARY_COLOR};
    border: 1px solid {PRIMARY_COLOR};
    border-radius: 2px;
    padding: 2px 8px;
}}
"""
