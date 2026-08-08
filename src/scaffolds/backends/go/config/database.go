package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
)

var DB *sql.DB

// InitDatabase 初始化数据库连接
func InitDatabase() {
	// parseTime=False: 让 DATETIME 以 MySQL 原生格式 "2026-05-06 21:54:43" 返回,
	// 避免被 Go 解析为 time.Time 后 JSON 序列化成 ISO "2026-05-06T21:54:43+08:00"
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=False&loc=Local",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

	var err error
	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("数据库连接失败:", err)
	}

	// 测试连接
	if err = DB.Ping(); err != nil {
		log.Fatal("数据库连接测试失败:", err)
	}

	// 设置连接池
	DB.SetMaxOpenConns(100)
	DB.SetMaxIdleConns(10)
}

// CloseDatabase 关闭数据库连接
func CloseDatabase() {
	if DB != nil {
		DB.Close()
	}
}
