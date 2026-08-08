// Package middleware 操作日志中间件
package middleware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"go-mysql-backend/config"
	"io"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// passwordRegex 用于脱敏密码字段
var passwordRegex = regexp.MustCompile(`("password"\s*:\s*)"[^"]*"`)

// LogOperation 操作日志中间件
// 无论操作成功或失败都会记录日志（登录失败、业务异常也会被记录）
// 用法：r.Use(middleware.LogOperation("操作描述"))
func LogOperation(operation string) gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()

		// 读取请求体（用于记录参数 + 提取用户名）
		var reqBody []byte
		if c.Request.Body != nil {
			reqBody, _ = io.ReadAll(c.Request.Body)
			c.Request.Body = io.NopCloser(bytes.NewBuffer(reqBody))
		}

		// 提前提取用户名（此时 Auth 中间件未必已运行完）
		username := extractUsername(c, operation, reqBody)

		// 包装 ResponseWriter 以捕获响应
		blw := &bodyLogWriter{body: bytes.NewBufferString(""), ResponseWriter: c.Writer}
		c.Writer = blw

		// 执行请求
		c.Next()

		// 登录成功后 c.Set("username") 会被调用，优先使用
		if username == "anonymous" {
			if u, exists := c.Get("username"); exists {
				if s, ok := u.(string); ok && s != "" {
					username = s
				}
			}
		}

		executeTime := time.Since(startTime).Milliseconds()

		// 使用 c.Copy() 保证 goroutine 中可安全访问
		ctxCopy := c.Copy()
		go saveLog(ctxCopy, operation, username, reqBody, blw.body.Bytes(), executeTime)
	}
}

// bodyLogWriter 捕获响应体
type bodyLogWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w *bodyLogWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

// extractUsername 提取用户名
func extractUsername(c *gin.Context, operation string, reqBody []byte) string {
	// 优先从 context 取（Auth 中间件设置的）
	if u, exists := c.Get("username"); exists {
		if s, ok := u.(string); ok && s != "" {
			return s
		}
	}
	// 登录/注册时从请求体取
	if strings.Contains(operation, "登录") || strings.Contains(operation, "注册") {
		if len(reqBody) > 0 {
			var body struct {
				Username string `json:"username"`
			}
			if err := json.Unmarshal(reqBody, &body); err == nil && body.Username != "" {
				return body.Username
			}
		}
	}
	return "anonymous"
}

// saveLog 异步保存操作日志
func saveLog(c *gin.Context, operation, username string, reqBody, respBody []byte, executeTime int64) {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("保存操作日志失败: %v\n", r)
		}
	}()

	// 解析响应判断成败
	op := operation
	var resp struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	}
	if err := json.Unmarshal(respBody, &resp); err == nil && resp.Code != 200 {
		op = fmt.Sprintf("%s[失败:%s]", operation, resp.Message)
		if len(op) > 100 {
			op = op[:100]
		}
	}

	method := fmt.Sprintf("%s %s", c.Request.Method, c.Request.URL.Path)
	ip := c.ClientIP()

	// 参数（脱敏密码 + 限制长度）
	var params *string
	if len(reqBody) > 0 {
		p := passwordRegex.ReplaceAllString(string(reqBody), `$1"***"`)
		if len(p) > 2000 {
			p = p[:2000] + "..."
		}
		params = &p
	}

	_, err := config.DB.Exec(
		"INSERT INTO operation_log (username, operation, method, params, execute_time, ip, create_time) VALUES (?, ?, ?, ?, ?, ?, NOW())",
		username, op, method, params, executeTime, ip,
	)
	if err != nil {
		fmt.Printf("操作日志写库失败: %v\n", err)
	}
}
