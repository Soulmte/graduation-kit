package services

// BizError 业务异常
type BizError struct {
	Code    int
	Message string
}

func (e *BizError) Error() string {
	return e.Message
}
