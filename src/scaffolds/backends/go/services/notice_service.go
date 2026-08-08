// Package services 公告服务
package services

import (
	"fmt"
	"go-mysql-backend/config"
	"go-mysql-backend/models"
	"go-mysql-backend/utils"
	"strings"
)

// NoticeAdd 创建公告
func NoticeAdd(data map[string]interface{}) error {
	title, _ := data["title"].(string)
	if title == "" {
		return &BizError{Code: utils.CodeBadRequest, Message: "标题不能为空"}
	}
	content, _ := data["content"].(string)
	_, err := config.DB.Exec("INSERT INTO notice (title, content, create_time) VALUES (?, ?, NOW())", title, content)
	return err
}

// NoticePageQuery 分页查询公告列表
func NoticePageQuery(query models.PageQuery) (map[string]interface{}, error) {
	query.Defaults()
	offset := (query.PageNum - 1) * query.PageSize

	where, args := "WHERE deleted = 0", []interface{}{}
	if query.Title != "" {
		where += " AND title LIKE ?"; args = append(args, "%"+query.Title+"%")
	}
	if query.Content != "" {
		where += " AND content LIKE ?"; args = append(args, "%"+query.Content+"%")
	}

	orderCol := map[string]string{"title": "title", "createTime": "create_time", "updateTime": "update_time"}[query.OrderBy]
	if orderCol == "" {
		orderCol = "create_time"
	}
	dir := "DESC"
	if query.Order == "asc" {
		dir = "ASC"
	}

	var total int64
	config.DB.QueryRow(fmt.Sprintf("SELECT COUNT(*) FROM notice %s", where), args...).Scan(&total)

	rows, err := config.DB.Query(
		fmt.Sprintf("SELECT id, title, content, create_time, update_time FROM notice %s ORDER BY %s %s LIMIT ? OFFSET ?", where, orderCol, dir),
		append(args, query.PageSize, offset)...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	records := []models.Notice{}
	for rows.Next() {
		var n models.Notice
		rows.Scan(&n.ID, &n.Title, &n.Content, &n.CreateTime, &n.UpdateTime)
		n.Format()
		records = append(records, n)
	}

	return map[string]interface{}{"records": records, "total": total, "pageNum": query.PageNum, "pageSize": query.PageSize}, nil
}

// NoticeListAll 查询所有公告
func NoticeListAll() ([]models.Notice, error) {
	rows, err := config.DB.Query("SELECT id, title, content, create_time, update_time FROM notice WHERE deleted = 0 ORDER BY create_time DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []models.Notice{}
	for rows.Next() {
		var n models.Notice
		rows.Scan(&n.ID, &n.Title, &n.Content, &n.CreateTime, &n.UpdateTime)
		n.Format()
		list = append(list, n)
	}
	return list, nil
}

// NoticeGetById 根据ID查询公告
func NoticeGetById(id string) (*models.Notice, error) {
	var n models.Notice
	err := config.DB.QueryRow("SELECT id, title, content, create_time, update_time FROM notice WHERE id = ? AND deleted = 0", id).
		Scan(&n.ID, &n.Title, &n.Content, &n.CreateTime, &n.UpdateTime)
	if err != nil {
		return nil, &BizError{Code: utils.CodeNotFound, Message: "公告不存在"}
	}
	n.Format()
	return &n, nil
}

// NoticeUpdate 更新公告
func NoticeUpdate(data map[string]interface{}) error {
	id := data["id"]
	title, _ := data["title"].(string)
	if id == nil || title == "" {
		return &BizError{Code: utils.CodeBadRequest, Message: "参数错误"}
	}
	content, _ := data["content"].(string)
	_, err := config.DB.Exec("UPDATE notice SET title = ?, content = ?, update_time = NOW() WHERE id = ? AND deleted = 0", title, content, id)
	return err
}

// NoticeDeleteById 删除公告（逻辑删除）
func NoticeDeleteById(id string) error {
	_, err := config.DB.Exec("UPDATE notice SET deleted = 1 WHERE id = ?", id)
	return err
}

// NoticeDeleteBatch 批量删除公告（逻辑删除）
func NoticeDeleteBatch(ids []interface{}) error {
	if len(ids) == 0 {
		return &BizError{Code: utils.CodeBadRequest, Message: "参数错误"}
	}
	placeholders := strings.Repeat("?,", len(ids))
	placeholders = placeholders[:len(placeholders)-1]
	_, err := config.DB.Exec(fmt.Sprintf("UPDATE notice SET deleted = 1 WHERE id IN (%s)", placeholders), ids...)
	return err
}
