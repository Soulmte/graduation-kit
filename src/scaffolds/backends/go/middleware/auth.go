package middleware

import (
	"go-mysql-backend/config"
	"go-mysql-backend/utils"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware JWT认证中间件
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.Error(c, utils.CodeUnauthorized, "未授权，请先登录")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(401, gin.H{"code": 401, "message": "Token格式错误", "data": nil})
			return
		}

		claims, err := config.ParseToken(parts[1])
		if err != nil {
			c.AbortWithStatusJSON(401, gin.H{"code": 401, "message": "Token无效或已过期", "data": nil})
			return
		}

		c.Set("userId", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)
		c.Next()
	}
}

// AdminMiddleware 管理员权限中间件
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role != "admin" {
			utils.Error(c, utils.CodeForbidden, "权限不足，禁止访问")
			c.Abort()
			return
		}
		c.Next()
	}
}
