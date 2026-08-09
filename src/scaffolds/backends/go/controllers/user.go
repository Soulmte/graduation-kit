// Package controllers 用户控制器
package controllers

import (
	"go-mysql-backend/models"
	"go-mysql-backend/services"
	"go-mysql-backend/utils"

	"github.com/gin-gonic/gin"
)

// Register 用户注册
func Register(c *gin.Context) {
	var data map[string]interface{}
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.Error(c, utils.CodeBadRequest, "参数错误")
		return
	}
	if err := services.UserRegister(data); err != nil {
		handleError(c, err)
		return
	}
	utils.SuccessMsg(c, "注册成功", nil)
}

// Login 用户登录
func Login(c *gin.Context) {
	var data map[string]interface{}
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.Error(c, utils.CodeBadRequest, "参数错误")
		return
	}
	username, _ := data["username"].(string)
	password, _ := data["password"].(string)
	result, err := services.UserLogin(username, password)
	if err != nil {
		handleError(c, err)
		return
	}
	utils.SuccessMsg(c, "登录成功", result)
}

// UserPageQuery 分页查询用户列表
func UserPageQuery(c *gin.Context) {
	var query models.PageQuery
	if err := c.ShouldBindJSON(&query); err != nil {
		utils.Error(c, utils.CodeBadRequest, "参数错误")
		return
	}
	result, err := services.UserPageQuery(query)
	if err != nil {
		handleError(c, err)
		return
	}
	utils.Success(c, result)
}

// UserListAll 查询所有用户列表
func UserListAll(c *gin.Context) {
	result, err := services.UserListAll()
	if err != nil {
		handleError(c, err)
		return
	}
	utils.Success(c, result)
}

// UserGetById 根据ID查询用户
func UserGetById(c *gin.Context) {
	result, err := services.UserGetById(c.Param("id"))
	if err != nil {
		handleError(c, err)
		return
	}
	utils.Success(c, result)
}

// UserUpdate 更新用户信息
func UserUpdate(c *gin.Context) {
	var data map[string]interface{}
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.Error(c, utils.CodeBadRequest, "参数错误")
		return
	}
	userId, role := currentUser(c)
	if err := services.UserUpdate(data, userId, role); err != nil {
		handleError(c, err)
		return
	}
	utils.SuccessMsg(c, "更新成功", nil)
}

// UserUpdatePassword 修改密码
func UserUpdatePassword(c *gin.Context) {
	var data map[string]interface{}
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.Error(c, utils.CodeBadRequest, "参数错误")
		return
	}
	userId, _ := currentUser(c)
	if err := services.UserUpdatePassword(data, userId); err != nil {
		handleError(c, err)
		return
	}
	utils.SuccessMsg(c, "密码修改成功", nil)
}

// UserDeleteById 删除用户
func UserDeleteById(c *gin.Context) {
	if err := services.UserDeleteById(c.Param("id")); err != nil {
		handleError(c, err)
		return
	}
	utils.SuccessMsg(c, "删除成功", nil)
}

// UserDeleteBatch 批量删除用户
func UserDeleteBatch(c *gin.Context) {
	ids := parseIds(c)
	if err := services.UserDeleteBatch(ids); err != nil {
		handleError(c, err)
		return
	}
	utils.SuccessMsg(c, "批量删除成功", nil)
}
