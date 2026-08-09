package utils

import "github.com/gin-gonic/gin"

// Result 统一响应结构
type Result struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

// 响应码常量
const (
	CodeSuccess       = 200
	CodeBadRequest    = 400
	CodeUnauthorized  = 401
	CodeForbidden     = 403
	CodeNotFound      = 404
	CodeError         = 500
	CodeLoginError    = 1001
	CodeUsernameExist = 1002
	CodePasswordError = 1004
	CodeDataExist     = 2001
	CodeDataNotExist  = 2002
)

// Success 成功响应
func Success(c *gin.Context, data interface{}) {
	c.JSON(200, Result{Code: CodeSuccess, Message: "操作成功", Data: data})
}

// SuccessMsg 成功响应带消息
func SuccessMsg(c *gin.Context, message string, data interface{}) {
	c.JSON(200, Result{Code: CodeSuccess, Message: message, Data: data})
}

// Error 错误响应
func Error(c *gin.Context, code int, message string) {
	c.JSON(200, Result{Code: code, Message: message, Data: nil})
}
