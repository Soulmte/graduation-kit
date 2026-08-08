// Package controllers 操作日志控制器
package controllers

import (
	"go-mysql-backend/models"
	"go-mysql-backend/services"
	"go-mysql-backend/utils"

	"github.com/gin-gonic/gin"
)

// LogPageQuery 分页查询操作日志
func LogPageQuery(c *gin.Context) {
	var query models.PageQuery
	if err := c.ShouldBindJSON(&query); err != nil {
		utils.Error(c, utils.CodeBadRequest, "参数错误")
		return
	}
	result, err := services.LogPageQuery(query)
	if err != nil {
		handleError(c, err)
		return
	}
	utils.Success(c, result)
}

// LogListAll 查询所有操作日志
func LogListAll(c *gin.Context) {
	result, err := services.LogListAll()
	if err != nil {
		handleError(c, err)
		return
	}
	utils.Success(c, result)
}

// LogGetById 根据ID查询操作日志
func LogGetById(c *gin.Context) {
	result, err := services.LogGetById(c.Param("id"))
	if err != nil {
		handleError(c, err)
		return
	}
	utils.Success(c, result)
}

// LogDeleteById 删除操作日志
func LogDeleteById(c *gin.Context) {
	if err := services.LogDeleteById(c.Param("id")); err != nil {
		handleError(c, err)
		return
	}
	utils.SuccessMsg(c, "删除成功", nil)
}

// LogDeleteBatch 批量删除操作日志
func LogDeleteBatch(c *gin.Context) {
	ids := parseIds(c)
	if err := services.LogDeleteBatch(ids); err != nil {
		handleError(c, err)
		return
	}
	utils.SuccessMsg(c, "批量删除成功", nil)
}
