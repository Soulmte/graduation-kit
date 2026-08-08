// Package services 操作日志服务
package services

import (
	"fmt"
	"go-mysql-backend/config"
	"go-mysql-backend/models"
	"go-mysql-backend/utils"
	"strings"
)

// LogPageQuery 分页查询操作日志
func LogPageQuery(query models.PageQuery) (map[string]interface{}, error) {
	query.Defaults()
	offset := (query.PageNum - 1) * query.PageSize

	where, args := "WHERE 1=1", []interface{}{}
	if query.Username != "" {
		where += " AND username LIKE ?"; args = append(args, "%"+query.Username+"%")
	}
	if query.Operation != "" {
		where += " AND operation LIKE ?"; args = append(args, "%"+query.Operation+"%")
	}
	if query.StartTime != "" {
		where += " AND create_time >= ?"; args = append(args, query.StartTime)
	}
	if query.EndTime != "" {
		where += " AND create_time <= ?"; args = append(args, query.EndTime)
	}

	orderCol := map[string]string{"username": "username", "operation": "operation", "executeTime": "execute_time", "createTime": "create_time"}[query.OrderBy]
	if orderCol == "" {
		orderCol = "create_time"
	}
	dir := "DESC"
	if query.Order == "asc" {
		dir = "ASC"
	}

	var total int64
	config.DB.QueryRow(fmt.Sprintf("SELECT COUNT(*) FROM operation_log %s", where), args...).Scan(&total)

	rows, err := config.DB.Query(
		fmt.Sprintf("SELECT id, username, operation, method, params, execute_time, ip, create_time FROM operation_log %s ORDER BY %s %s LIMIT ? OFFSET ?", where, orderCol, dir),
		append(args, query.PageSize, offset)...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	records := []models.OperationLog{}
	for rows.Next() {
		var l models.OperationLog
		rows.Scan(&l.ID, &l.Username, &l.Operation, &l.Method, &l.Params, &l.ExecuteTime, &l.IP, &l.CreateTime)
		l.Format()
		records = append(records, l)
	}

	return map[string]interface{}{"records": records, "total": total, "pageNum": query.PageNum, "pageSize": query.PageSize}, nil
}

// LogListAll 查询所有操作日志
func LogListAll() ([]models.OperationLog, error) {
	rows, err := config.DB.Query("SELECT id, username, operation, method, params, execute_time, ip, create_time FROM operation_log ORDER BY create_time DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []models.OperationLog{}
	for rows.Next() {
		var l models.OperationLog
		rows.Scan(&l.ID, &l.Username, &l.Operation, &l.Method, &l.Params, &l.ExecuteTime, &l.IP, &l.CreateTime)
		l.Format()
		list = append(list, l)
	}
	return list, nil
}

// LogGetById 根据ID查询操作日志
func LogGetById(id string) (*models.OperationLog, error) {
	var l models.OperationLog
	err := config.DB.QueryRow("SELECT id, username, operation, method, params, execute_time, ip, create_time FROM operation_log WHERE id = ?", id).
		Scan(&l.ID, &l.Username, &l.Operation, &l.Method, &l.Params, &l.ExecuteTime, &l.IP, &l.CreateTime)
	if err != nil {
		return nil, &BizError{Code: utils.CodeNotFound, Message: "日志不存在"}
	}
	l.Format()
	return &l, nil
}

// LogDeleteById 删除操作日志
func LogDeleteById(id string) error {
	_, err := config.DB.Exec("DELETE FROM operation_log WHERE id = ?", id)
	return err
}

// LogDeleteBatch 批量删除操作日志
func LogDeleteBatch(ids []interface{}) error {
	if len(ids) == 0 {
		return &BizError{Code: utils.CodeBadRequest, Message: "参数错误"}
	}
	placeholders := strings.Repeat("?,", len(ids))
	placeholders = placeholders[:len(placeholders)-1]
	_, err := config.DB.Exec(fmt.Sprintf("DELETE FROM operation_log WHERE id IN (%s)", placeholders), ids...)
	return err
}
