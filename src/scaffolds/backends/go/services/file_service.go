// Package services 文件服务
package services

import (
	"fmt"
	"go-mysql-backend/config"
	"go-mysql-backend/utils"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

var allowedExtensions = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".bmp": true, ".webp": true,
	".pdf": true, ".doc": true, ".docx": true, ".xls": true, ".xlsx": true, ".ppt": true, ".pptx": true,
	".txt": true, ".zip": true, ".rar": true, ".7z": true,
}

// FileUpload 上传单个文件
func FileUpload(c *gin.Context, file *multipart.FileHeader) (map[string]interface{}, error) {
	if err := validateFile(file); err != nil {
		return nil, err
	}
	url, err := saveFile(c, file)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{"url": url, "fileName": file.Filename}, nil
}

// FileUploadBatch 批量上传文件
func FileUploadBatch(c *gin.Context, files []*multipart.FileHeader) map[string]interface{} {
	success := []map[string]string{}
	fail := []string{}

	for _, file := range files {
		if err := validateFile(file); err != nil {
			fail = append(fail, fmt.Sprintf("%s: %s", file.Filename, err.Error()))
			continue
		}
		url, err := saveFile(c, file)
		if err != nil {
			fail = append(fail, fmt.Sprintf("%s: %s", file.Filename, err.Error()))
			continue
		}
		success = append(success, map[string]string{"fileName": file.Filename, "url": url})
	}

	return map[string]interface{}{
		"success": success, "fail": fail,
		"total": len(files), "successCount": len(success), "failCount": len(fail),
	}
}

// FileDelete 删除文件
func FileDelete(fileName string) error {
	if fileName == "" {
		return &BizError{Code: utils.CodeBadRequest, Message: "文件名不能为空"}
	}
	relativePath := strings.Replace(fileName, "/uploads/", "", 1)
	uploadConfig := config.GetUploadConfig()
	basePath, _ := filepath.Abs(uploadConfig.UploadDir)
	absolutePath, _ := filepath.Abs(filepath.Join(basePath, relativePath))
	if !strings.HasPrefix(absolutePath, basePath+string(os.PathSeparator)) && absolutePath != basePath {
		return &BizError{Code: utils.CodeBadRequest, Message: "非法的文件路径"}
	}
	if _, err := os.Stat(absolutePath); err == nil {
		os.Remove(absolutePath)
	}
	return nil
}

func validateFile(file *multipart.FileHeader) error {
	if file == nil || file.Size == 0 {
		return &BizError{Code: utils.CodeBadRequest, Message: "文件不能为空"}
	}
	uploadConfig := config.GetUploadConfig()
	if file.Size > uploadConfig.MaxFileSize {
		return &BizError{Code: utils.CodeBadRequest, Message: "文件大小不能超过10MB"}
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedExtensions[ext] {
		return &BizError{Code: utils.CodeBadRequest, Message: fmt.Sprintf("不支持的文件类型: %s", ext)}
	}
	return nil
}

func saveFile(c *gin.Context, file *multipart.FileHeader) (string, error) {
	ext := strings.ToLower(filepath.Ext(file.Filename))
	newName := uuid.New().String() + ext
	dateDir := time.Now().Format("2006-01-02")
	uploadConfig := config.GetUploadConfig()
	dir := filepath.Join(uploadConfig.UploadDir, dateDir)

	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", &BizError{Code: utils.CodeError, Message: "创建目录失败"}
	}

	dst := filepath.Join(dir, newName)
	if err := c.SaveUploadedFile(file, dst); err != nil {
		return "", &BizError{Code: utils.CodeError, Message: "保存文件失败"}
	}

	return fmt.Sprintf("/uploads/%s/%s", dateDir, newName), nil
}
