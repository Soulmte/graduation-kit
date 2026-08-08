// Package controllers 文件上传控制器
package controllers

import (
	"go-mysql-backend/services"
	"go-mysql-backend/utils"

	"github.com/gin-gonic/gin"
)

// FileUpload 上传单个文件
func FileUpload(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		utils.Error(c, utils.CodeBadRequest, "请选择文件")
		return
	}
	result, err := services.FileUpload(c, file)
	if err != nil {
		handleError(c, err)
		return
	}
	utils.SuccessMsg(c, "上传成功", result)
}

// FileUploadBatch 批量上传文件
func FileUploadBatch(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil || form.File["files"] == nil {
		utils.Error(c, utils.CodeBadRequest, "请选择文件")
		return
	}
	result := services.FileUploadBatch(c, form.File["files"])
	utils.SuccessMsg(c, "批量上传成功", result)
}

// FileDelete 删除文件
func FileDelete(c *gin.Context) {
	fileName := c.Query("fileName")
	if err := services.FileDelete(fileName); err != nil {
		handleError(c, err)
		return
	}
	utils.SuccessMsg(c, "删除成功", nil)
}
