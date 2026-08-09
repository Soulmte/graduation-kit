package controllers

import (
	"go-mysql-backend/services"
	"go-mysql-backend/utils"

	"github.com/gin-gonic/gin"
)

// handleError 统一错误处理
func handleError(c *gin.Context, err error) {
	if bizErr, ok := err.(*services.BizError); ok {
		utils.Error(c, bizErr.Code, bizErr.Message)
	} else {
		utils.Error(c, utils.CodeError, err.Error())
	}
}

// parseIds 从请求体解析ID列表
func parseIds(c *gin.Context) []interface{} {
	var rawIds []float64
	c.ShouldBindJSON(&rawIds)
	ids := make([]interface{}, len(rawIds))
	for i, id := range rawIds {
		ids[i] = int64(id)
	}
	return ids
}

// currentUser 从登录态取当前用户ID与角色, 由AuthMiddleware写入
func currentUser(c *gin.Context) (int, string) {
	id, _ := c.Get("userId")
	role, _ := c.Get("role")
	userId, _ := id.(int)
	userRole, _ := role.(string)
	return userId, userRole
}
