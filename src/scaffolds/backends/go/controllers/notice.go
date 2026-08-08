// Package controllers 公告控制器
package controllers

import (
	"go-mysql-backend/models"
	"go-mysql-backend/services"
	"go-mysql-backend/utils"

	"github.com/gin-gonic/gin"
)

// NoticeAdd 创建公告
func NoticeAdd(c *gin.Context) {
	var data map[string]interface{}
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.Error(c, utils.CodeBadRequest, "参数错误")
		return
	}
	if err := services.NoticeAdd(data); err != nil {
		handleError(c, err)
		return
	}
	utils.SuccessMsg(c, "创建成功", nil)
}

// NoticePageQuery 分页查询公告列表
func NoticePageQuery(c *gin.Context) {
	var query models.PageQuery
	if err := c.ShouldBindJSON(&query); err != nil {
		utils.Error(c, utils.CodeBadRequest, "参数错误")
		return
	}
	result, err := services.NoticePageQuery(query)
	if err != nil {
		handleError(c, err)
		return
	}
	utils.Success(c, result)
}

// NoticeListAll 查询所有公告列表
func NoticeListAll(c *gin.Context) {
	result, err := services.NoticeListAll()
	if err != nil {
		handleError(c, err)
		return
	}
	utils.Success(c, result)
}

// NoticeGetById 根据ID查询公告
func NoticeGetById(c *gin.Context) {
	result, err := services.NoticeGetById(c.Param("id"))
	if err != nil {
		handleError(c, err)
		return
	}
	utils.Success(c, result)
}

// NoticeUpdate 更新公告
func NoticeUpdate(c *gin.Context) {
	var data map[string]interface{}
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.Error(c, utils.CodeBadRequest, "参数错误")
		return
	}
	if err := services.NoticeUpdate(data); err != nil {
		handleError(c, err)
		return
	}
	utils.SuccessMsg(c, "更新成功", nil)
}

// NoticeDeleteById 删除公告
func NoticeDeleteById(c *gin.Context) {
	if err := services.NoticeDeleteById(c.Param("id")); err != nil {
		handleError(c, err)
		return
	}
	utils.SuccessMsg(c, "删除成功", nil)
}

// NoticeDeleteBatch 批量删除公告
func NoticeDeleteBatch(c *gin.Context) {
	ids := parseIds(c)
	if err := services.NoticeDeleteBatch(ids); err != nil {
		handleError(c, err)
		return
	}
	utils.SuccessMsg(c, "批量删除成功", nil)
}
