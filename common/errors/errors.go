package errors

import "errors"

var (
	ErrNotFound           = errors.New("resource not found")
	ErrUnauthorized       = errors.New("unauthorized")
	ErrForbidden          = errors.New("forbidden")
	ErrInvalidParameter   = errors.New("invalid parameter")
	ErrInternalServer     = errors.New("internal server error")
	ErrDuplicateEntry     = errors.New("duplicate entry")
	ErrInvalidToken       = errors.New("invalid token")
	ErrTokenExpired       = errors.New("token expired")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrJobNotFound        = errors.New("job not found")
	ErrStudentNotFound    = errors.New("student not found")
	ErrReportNotFound     = errors.New("report not found")
	ErrInvalidFormat      = errors.New("invalid format")
	ErrGenerationFailed   = errors.New("generation failed")
)

type CodeError struct {
	Code int
	Msg  string
	Err  error
}

func (e *CodeError) Error() string {
	if e.Err != nil {
		return e.Err.Error()
	}
	return e.Msg
}

func NewCodeError(code int, msg string) *CodeError {
	return &CodeError{Code: code, Msg: msg}
}

func WithError(err error) *CodeError {
	return &CodeError{Code: 500, Msg: err.Error(), Err: err}
}

const (
	CodeSuccess        = 0
	CodeInvalidParams  = 400
	CodeUnauthorized   = 401
	CodeForbidden      = 403
	CodeNotFound       = 404
	CodeInternalError  = 500
	CodeDuplicateEntry = 409
)

func Success() (int, string) {
	return CodeSuccess, "success"
}

func Fail() (int, string) {
	return CodeInternalError, "internal error"
}

func FailWithMsg(msg string) (int, string) {
	return CodeInternalError, msg
}

func InvalidParams(msg string) (int, string) {
	return CodeInvalidParams, msg
}

func NotFound(msg string) (int, string) {
	return CodeNotFound, msg
}
