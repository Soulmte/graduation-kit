// Package services 用户服务
package services

import (
	"fmt"
	"go-mysql-backend/config"
	"go-mysql-backend/models"
	"go-mysql-backend/utils"
	"strings"
)

// 用户常用列, 统一在此维护, 防止字段漏写
const userColumns = "id, username, nickname, age, gender, phone, email, role, avatar, create_time, update_time"

// scanUser 从 rows 解析一个 User
func scanUser(scanner interface {
	Scan(dest ...interface{}) error
}, u *models.User) error {
	return scanner.Scan(
		&u.ID, &u.Username, &u.Nickname, &u.Age, &u.Gender,
		&u.Phone, &u.Email, &u.Role, &u.Avatar,
		&u.CreateTime, &u.UpdateTime,
	)
}

// UserRegister 用户注册
func UserRegister(data map[string]interface{}) error {
	username, _ := data["username"].(string)
	password, _ := data["password"].(string)
	if username == "" || password == "" {
		return &BizError{Code: utils.CodeBadRequest, Message: "用户名和密码不能为空"}
	}

	var count int
	config.DB.QueryRow("SELECT COUNT(*) FROM user WHERE username = ? AND deleted = 0", username).Scan(&count)
	if count > 0 {
		return &BizError{Code: utils.CodeUsernameExist, Message: "用户名已存在"}
	}

	nickname, _ := data["nickname"].(string)
	gender, _ := data["gender"].(string)
	phone, _ := data["phone"].(string)
	email, _ := data["email"].(string)
	role, _ := data["role"].(string)
	if role == "" {
		role = "user"
	}
	age := toInt(data["age"])

	_, err := config.DB.Exec(
		`INSERT INTO user (username, password, nickname, age, gender, phone, email, role, create_time)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
		username, password, nickname, age, gender, phone, email, role)
	return err
}

// UserLogin 用户登录
func UserLogin(username, password string) (map[string]interface{}, error) {
	if username == "" || password == "" {
		return nil, &BizError{Code: utils.CodeBadRequest, Message: "用户名和密码不能为空"}
	}

	var user models.User
	err := scanUser(config.DB.QueryRow(
		"SELECT "+userColumns+" FROM user WHERE username = ? AND password = ? AND deleted = 0",
		username, password,
	), &user)

	if err != nil {
		return nil, &BizError{Code: utils.CodeLoginError, Message: "用户名或密码错误"}
	}

	token, err := config.GenerateToken(int(user.ID), user.Username, user.Role)
	if err != nil {
		return nil, &BizError{Code: utils.CodeError, Message: "生成令牌失败"}
	}

	user.Format()
	return map[string]interface{}{"token": token, "userInfo": user}, nil
}

// UserPageQuery 分页查询用户列表
func UserPageQuery(query models.PageQuery) (map[string]interface{}, error) {
	query.Defaults()
	offset := (query.PageNum - 1) * query.PageSize

	where, args := "WHERE deleted = 0", []interface{}{}
	if query.Username != "" {
		where += " AND username LIKE ?"
		args = append(args, "%"+query.Username+"%")
	}
	if query.Email != "" {
		where += " AND email LIKE ?"
		args = append(args, "%"+query.Email+"%")
	}
	if query.Role != "" {
		where += " AND role = ?"
		args = append(args, query.Role)
	}

	orderCol := map[string]string{
		"username": "username", "nickname": "nickname",
		"email": "email", "role": "role", "createTime": "create_time",
	}[query.OrderBy]
	if orderCol == "" {
		orderCol = "create_time"
	}
	dir := "DESC"
	if query.Order == "asc" {
		dir = "ASC"
	}

	var total int64
	config.DB.QueryRow(fmt.Sprintf("SELECT COUNT(*) FROM user %s", where), args...).Scan(&total)

	rows, err := config.DB.Query(
		fmt.Sprintf("SELECT %s FROM user %s ORDER BY %s %s LIMIT ? OFFSET ?",
			userColumns, where, orderCol, dir),
		append(args, query.PageSize, offset)...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	records := []models.User{}
	for rows.Next() {
		var u models.User
		scanUser(rows, &u)
		u.Format()
		records = append(records, u)
	}

	return map[string]interface{}{
		"records": records, "total": total,
		"pageNum": query.PageNum, "pageSize": query.PageSize,
	}, nil
}

// UserListAll 查询所有用户
func UserListAll() ([]models.User, error) {
	rows, err := config.DB.Query(
		"SELECT " + userColumns + " FROM user WHERE deleted = 0 ORDER BY create_time DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := []models.User{}
	for rows.Next() {
		var u models.User
		scanUser(rows, &u)
		u.Format()
		users = append(users, u)
	}
	return users, nil
}

// UserGetById 根据ID查询用户
func UserGetById(id string) (*models.User, error) {
	var u models.User
	err := scanUser(config.DB.QueryRow(
		"SELECT "+userColumns+" FROM user WHERE id = ? AND deleted = 0", id), &u)
	if err != nil {
		return nil, &BizError{Code: utils.CodeNotFound, Message: "用户不存在"}
	}
	u.Format()
	return &u, nil
}

// UserUpdate 更新用户信息
// 只接受可修改字段, role与password不可通过本接口修改
// currentUserId/currentRole 由控制层从登录态传入, 普通用户只能改自己
func UserUpdate(data map[string]interface{}, currentUserId int, currentRole string) error {
	id := data["id"]
	if id == nil {
		return &BizError{Code: utils.CodeBadRequest, Message: "用户ID不能为空"}
	}

	if currentRole != "admin" && fmt.Sprint(id) != fmt.Sprint(currentUserId) {
		return &BizError{Code: utils.CodeForbidden, Message: "权限不足，只能修改自己的信息"}
	}

	var exist int
	if err := config.DB.QueryRow(
		"SELECT id FROM user WHERE id = ? AND deleted = 0", id).Scan(&exist); err != nil {
		return &BizError{Code: utils.CodeNotFound, Message: "用户不存在"}
	}

	nickname, _ := data["nickname"].(string)
	gender, _ := data["gender"].(string)
	phone, _ := data["phone"].(string)
	email, _ := data["email"].(string)
	avatar, _ := data["avatar"].(string)
	age := toInt(data["age"])

	_, err := config.DB.Exec(
		`UPDATE user SET nickname = ?, age = ?, gender = ?, phone = ?,
		 email = ?, avatar = ?, update_time = NOW() WHERE id = ? AND deleted = 0`,
		nickname, age, gender, phone, email, avatar, id)
	return err
}

// UserUpdatePassword 修改当前登录用户的密码
// 用户ID从登录态取, 不接受前端传入
func UserUpdatePassword(data map[string]interface{}, currentUserId int) error {
	oldPassword, _ := data["oldPassword"].(string)
	newPassword, _ := data["newPassword"].(string)
	if oldPassword == "" || newPassword == "" {
		return &BizError{Code: utils.CodeBadRequest, Message: "原密码和新密码不能为空"}
	}
	if len(newPassword) < 6 || len(newPassword) > 20 {
		return &BizError{Code: utils.CodeBadRequest, Message: "新密码长度必须在6-20位之间"}
	}

	var current string
	if err := config.DB.QueryRow(
		"SELECT password FROM user WHERE id = ? AND deleted = 0", currentUserId).Scan(&current); err != nil {
		return &BizError{Code: utils.CodeNotFound, Message: "用户不存在"}
	}
	if current != oldPassword {
		return &BizError{Code: utils.CodePasswordError, Message: "原密码错误"}
	}

	_, err := config.DB.Exec(
		"UPDATE user SET password = ?, update_time = NOW() WHERE id = ? AND deleted = 0",
		newPassword, currentUserId)
	return err
}

// UserDeleteById 删除用户(逻辑删除)
func UserDeleteById(id string) error {
	_, err := config.DB.Exec("UPDATE user SET deleted = 1 WHERE id = ?", id)
	return err
}

// UserDeleteBatch 批量删除用户(逻辑删除)
func UserDeleteBatch(ids []interface{}) error {
	if len(ids) == 0 {
		return &BizError{Code: utils.CodeBadRequest, Message: "参数错误"}
	}
	placeholders := strings.Repeat("?,", len(ids))
	placeholders = placeholders[:len(placeholders)-1]
	_, err := config.DB.Exec(
		fmt.Sprintf("UPDATE user SET deleted = 1 WHERE id IN (%s)", placeholders), ids...)
	return err
}

// toInt JSON 反序列化后数字是 float64, 这里安全转成可空 int
func toInt(v interface{}) interface{} {
	switch n := v.(type) {
	case nil:
		return nil
	case float64:
		if n == 0 {
			return nil
		}
		return int(n)
	case int:
		if n == 0 {
			return nil
		}
		return n
	case string:
		if n == "" {
			return nil
		}
		// 尝试解析
		var i int
		fmt.Sscanf(n, "%d", &i)
		if i == 0 {
			return nil
		}
		return i
	}
	return nil
}
