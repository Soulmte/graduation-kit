package main

import (
	"fmt"
	"go-mysql-backend/config"
	"go-mysql-backend/controllers"
	"go-mysql-backend/middleware"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// 加载环境变量
	if err := godotenv.Load(); err != nil {
		log.Fatal("加载.env文件失败")
	}

	// 初始化数据库
	config.InitDatabase()
	defer config.CloseDatabase()

	// 创建Gin实例
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(config.CORSMiddleware())
	r.Use(middleware.RequestLogger())

	// 确保上传目录存在
	uploadConfig := config.GetUploadConfig()
	os.MkdirAll(uploadConfig.UploadDir, 0755)

	// 静态文件服务
	r.Static("/uploads", uploadConfig.UploadDir)

	// 路由
	api := r.Group("/api")
	{
		auth := middleware.AuthMiddleware()
		admin := middleware.AdminMiddleware()

		// 用户路由
		user := api.Group("/user")
		{
			user.POST("/register", middleware.LogOperation("用户注册"), controllers.Register)
			user.POST("/login", middleware.LogOperation("用户登录"), controllers.Login)
			user.POST("/pageQuery", auth, admin, middleware.LogOperation("分页查询用户"), controllers.UserPageQuery)
			user.GET("/listAll", auth, admin, middleware.LogOperation("查询用户列表"), controllers.UserListAll)
			user.GET("/getById/:id", auth, middleware.LogOperation("查询用户详情"), controllers.UserGetById)
			user.PUT("/update", auth, middleware.LogOperation("更新用户信息"), controllers.UserUpdate)
			user.PUT("/updatePassword", auth, middleware.LogOperation("修改密码"), controllers.UserUpdatePassword)
			user.DELETE("/deleteById/:id", auth, admin, middleware.LogOperation("删除用户"), controllers.UserDeleteById)
			user.DELETE("/deleteBatch", auth, admin, middleware.LogOperation("批量删除用户"), controllers.UserDeleteBatch)
		}

		// 公告路由
		notice := api.Group("/notice")
		{
			notice.POST("/add", auth, admin, middleware.LogOperation("创建公告"), controllers.NoticeAdd)
			notice.POST("/pageQuery", auth, middleware.LogOperation("分页查询公告"), controllers.NoticePageQuery)
			notice.GET("/listAll", auth, middleware.LogOperation("查询公告列表"), controllers.NoticeListAll)
			notice.GET("/getById/:id", auth, middleware.LogOperation("查询公告详情"), controllers.NoticeGetById)
			notice.PUT("/update", auth, admin, middleware.LogOperation("更新公告"), controllers.NoticeUpdate)
			notice.DELETE("/deleteById/:id", auth, admin, middleware.LogOperation("删除公告"), controllers.NoticeDeleteById)
			notice.DELETE("/deleteBatch", auth, admin, middleware.LogOperation("批量删除公告"), controllers.NoticeDeleteBatch)
		}

		// 日志路由
		logGroup := api.Group("/log")
		{
			logGroup.POST("/pageQuery", auth, admin, middleware.LogOperation("分页查询操作日志"), controllers.LogPageQuery)
			logGroup.GET("/listAll", auth, admin, controllers.LogListAll)
			logGroup.GET("/getById/:id", auth, admin, controllers.LogGetById)
			logGroup.DELETE("/deleteById/:id", auth, admin, middleware.LogOperation("删除操作日志"), controllers.LogDeleteById)
			logGroup.DELETE("/deleteBatch", auth, admin, middleware.LogOperation("批量删除操作日志"), controllers.LogDeleteBatch)
		}

		// 文件路由
		file := api.Group("/file")
		{
			file.POST("/upload", auth, middleware.LogOperation("上传文件"), controllers.FileUpload)
			file.POST("/uploadBatch", auth, middleware.LogOperation("批量上传文件"), controllers.FileUploadBatch)
			file.DELETE("/delete", auth, middleware.LogOperation("删除文件"), controllers.FileDelete)
		}

		// 健康检查（含数据库连通性）
		api.GET("/health", func(c *gin.Context) {
			dbStatus := "ok"
			if err := config.DB.Ping(); err != nil {
				dbStatus = fmt.Sprintf("error: %s", err.Error())
			}
			c.JSON(200, gin.H{
				"code":    200,
				"message": "操作成功",
				"data":    gin.H{"service": "Go", "database": dbStatus},
			})
		})
	}

	// 启动服务器
	port := config.GetPort()
	fmt.Println("========================================")
	fmt.Println("  Go + MySQL Backend Server")
	fmt.Println("========================================")
	fmt.Printf("  Server:   http://localhost:%s\n", port)
	fmt.Printf("  Database: %s\n", os.Getenv("DB_NAME"))
	fmt.Println("========================================")

	r.Run(":" + port)
}
