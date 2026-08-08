package config

import "os"

// GetPort 获取服务器端口
func GetPort() string {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8084"
	}
	return port
}
