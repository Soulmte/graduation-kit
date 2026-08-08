"""PyQt6 桌面客户端入口"""
import sys
from PyQt6.QtWidgets import QApplication
from styles import QSS
from views.login_window import LoginWindow
from views.main_window import MainWindow


def main():
    app = QApplication(sys.argv)
    app.setStyleSheet(QSS)

    # 先弹登录窗口
    login = LoginWindow()
    if login.exec():
        # 登录成功 → 打开主窗口
        main_window = MainWindow()
        main_window.show()
        # 防止主窗口被 GC
        app._main_window = main_window
        sys.exit(app.exec())
    else:
        sys.exit(0)


if __name__ == '__main__':
    main()
