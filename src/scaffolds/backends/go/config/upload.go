package config

import (
	"os"
	"strconv"
)

// UploadConfig 上传配置
type UploadConfig struct {
	UploadDir   string
	MaxFileSize int64
}

// GetUploadConfig 获取上传配置
func GetUploadConfig() *UploadConfig {
	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "../../uploads"
	}

	maxFileSize, _ := strconv.ParseInt(os.Getenv("MAX_FILE_SIZE"), 10, 64)
	if maxFileSize == 0 {
		maxFileSize = 10485760 // 10MB
	}

	return &UploadConfig{
		UploadDir:   uploadDir,
		MaxFileSize: maxFileSize,
	}
}
