package middleware

import (
	"fmt"
	"time"

	"github.com/fatih/color"
	"github.com/gin-gonic/gin"
)

// RequestLogger 请求日志中间件（开发期彩色输出）
func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()

		c.Next()

		duration := time.Since(startTime)
		statusCode := c.Writer.Status()

		var statusColor *color.Color
		if statusCode == 200 {
			statusColor = color.New(color.FgGreen)
		} else if statusCode >= 400 && statusCode < 500 {
			statusColor = color.New(color.FgYellow)
		} else if statusCode >= 500 {
			statusColor = color.New(color.FgRed)
		} else {
			statusColor = color.New(color.FgBlue)
		}

		// dev only
		fmt.Printf("%s %s %s %s %s\n",
			color.WhiteString("[%s]", time.Now().Format("15:04:05")),
			color.CyanString("%-6s", c.Request.Method),
			color.WhiteString("%-30s", c.Request.URL.Path),
			statusColor.Sprintf("CODE: %d", statusCode),
			color.MagentaString("%dms", duration.Milliseconds()),
		)
	}
}
