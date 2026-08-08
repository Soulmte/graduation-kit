package models

import "database/sql"

// User 用户实体
type User struct {
	ID          int64          `json:"id"`
	Username    string         `json:"username"`
	Password    *string        `json:"password,omitempty"`
	Nickname    sql.NullString `json:"-"`
	NicknameStr string         `json:"nickname"`
	Age         sql.NullInt64  `json:"-"`
	AgeVal      *int64         `json:"age"`
	Gender      sql.NullString `json:"-"`
	GenderStr   string         `json:"gender"`
	Phone       sql.NullString `json:"-"`
	PhoneStr    string         `json:"phone"`
	Email       sql.NullString `json:"-"`
	EmailStr    string         `json:"email"`
	Role        string         `json:"role"`
	Avatar      sql.NullString `json:"-"`
	AvatarStr   string         `json:"avatar"`
	CreateTime  sql.NullString `json:"-"`
	CreateStr   string         `json:"createTime"`
	UpdateTime  sql.NullString `json:"-"`
	UpdateStr   string         `json:"updateTime"`
}

// FormatUser 格式化用户输出
func (u *User) Format() {
	if u.Nickname.Valid {
		u.NicknameStr = u.Nickname.String
	}
	if u.Age.Valid {
		v := u.Age.Int64
		u.AgeVal = &v
	}
	if u.Gender.Valid {
		u.GenderStr = u.Gender.String
	}
	if u.Phone.Valid {
		u.PhoneStr = u.Phone.String
	}
	if u.Email.Valid {
		u.EmailStr = u.Email.String
	}
	if u.Avatar.Valid {
		u.AvatarStr = u.Avatar.String
	}
	if u.CreateTime.Valid {
		u.CreateStr = u.CreateTime.String
	}
	if u.UpdateTime.Valid {
		u.UpdateStr = u.UpdateTime.String
	}
	u.Password = nil
}

// Notice 公告实体
type Notice struct {
	ID         int64          `json:"id"`
	Title      string         `json:"title"`
	Content    sql.NullString `json:"-"`
	ContentStr string         `json:"content"`
	CreateTime sql.NullString `json:"-"`
	CreateStr  string         `json:"createTime"`
	UpdateTime sql.NullString `json:"-"`
	UpdateStr  string         `json:"updateTime"`
}

// Format 格式化公告输出
func (n *Notice) Format() {
	if n.Content.Valid {
		n.ContentStr = n.Content.String
	}
	if n.CreateTime.Valid {
		n.CreateStr = n.CreateTime.String
	}
	if n.UpdateTime.Valid {
		n.UpdateStr = n.UpdateTime.String
	}
}

// OperationLog 操作日志实体
type OperationLog struct {
	ID          int64          `json:"id"`
	Username    sql.NullString `json:"-"`
	UsernameStr string         `json:"username"`
	Operation   sql.NullString `json:"-"`
	OperStr     string         `json:"operation"`
	Method      sql.NullString `json:"-"`
	MethodStr   string         `json:"method"`
	Params      sql.NullString `json:"-"`
	ParamsStr   *string        `json:"params"`
	ExecuteTime sql.NullInt64  `json:"-"`
	ExecTime    *int64         `json:"executeTime"`
	IP          sql.NullString `json:"-"`
	IPStr       string         `json:"ip"`
	CreateTime  sql.NullString `json:"-"`
	CreateStr   string         `json:"createTime"`
}

// Format 格式化日志输出
func (l *OperationLog) Format() {
	if l.Username.Valid {
		l.UsernameStr = l.Username.String
	}
	if l.Operation.Valid {
		l.OperStr = l.Operation.String
	}
	if l.Method.Valid {
		l.MethodStr = l.Method.String
	}
	if l.Params.Valid {
		l.ParamsStr = &l.Params.String
	}
	if l.ExecuteTime.Valid {
		l.ExecTime = &l.ExecuteTime.Int64
	}
	if l.IP.Valid {
		l.IPStr = l.IP.String
	}
	if l.CreateTime.Valid {
		l.CreateStr = l.CreateTime.String
	}
}

// PageQuery 分页查询参数
type PageQuery struct {
	PageNum   int    `json:"pageNum"`
	PageSize  int    `json:"pageSize"`
	OrderBy   string `json:"orderBy"`
	Order     string `json:"order"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	Title     string `json:"title"`
	Content   string `json:"content"`
	Operation string `json:"operation"`
	StartTime string `json:"startTime"`
	EndTime   string `json:"endTime"`
}

// Defaults 设置默认值
func (q *PageQuery) Defaults() {
	if q.PageNum <= 0 {
		q.PageNum = 1
	}
	if q.PageSize <= 0 {
		q.PageSize = 10
	}
	if q.Order == "" {
		q.Order = "desc"
	}
}
