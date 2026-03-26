package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
)

type ValidationMiddleware struct {
	validate *validator.Validate
}

func NewValidationMiddleware() *ValidationMiddleware {
	return &ValidationMiddleware{
		validate: validator.New(),
	}
}

// Validate 验证请求体参数
func (m *ValidationMiddleware) Validate(req interface{}) error {
	return m.validate.Struct(req)
}

// ValidationHandler 返回一个验证处理函数
func (m *ValidationMiddleware) ValidationHandler(next http.HandlerFunc, req interface{}) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 只处理POST、PUT、PATCH请求
		if r.Method != http.MethodPost && r.Method != http.MethodPut && r.Method != http.MethodPatch {
			next(w, r)
			return
		}

		// 解析请求体
		contentType := r.Header.Get("Content-Type")
		if contentType == "" || !strings.Contains(contentType, "application/json") {
			next(w, r)
			return
		}

		// 解析JSON到请求结构体
		if err := json.NewDecoder(r.Body).Decode(req); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"code": 400,
				"msg":  "invalid request body: " + err.Error(),
			})
			return
		}

		// 验证请求参数
		if err := m.Validate(req); err != nil {
			// 获取验证错误信息
			errors := m.formatValidationErrors(err)
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"code": 400,
				"msg":  "validation failed",
				"errors": errors,
			})
			return
		}

		// 将验证后的请求体放回context
		ctx := context.WithValue(r.Context(), "validatedReq", req)
		next(w, r.WithContext(ctx))
	}
}

// formatValidationErrors 格式化验证错误信息
func (m *ValidationMiddleware) formatValidationErrors(err error) []map[string]string {
	var errors []map[string]string

	// 处理验证错误
	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		for _, e := range validationErrors {
			errors = append(errors, map[string]string{
				"field":   e.Field(),
				"tag":     e.Tag(),
				"message": m.getErrorMessage(e),
			})
		}
	}

	return errors
}

// getErrorMessage 根据验证tag返回错误信息
func (m *ValidationMiddleware) getErrorMessage(fieldError validator.FieldError) string {
	field := fieldError.Field()
	tag := fieldError.Tag()
	param := fieldError.Param()

	switch tag {
	case "required":
		return field + " is required"
	case "min":
		return field + " must be at least " + param + " characters"
	case "max":
		return field + " must be at most " + param + " characters"
	case "email":
		return field + " must be a valid email address"
	case "len":
		return field + " must be exactly " + param + " characters"
	case "oneof":
		return field + " must be one of: " + param
	case "gt":
		return field + " must be greater than " + param
	case "gte":
		return field + " must be greater than or equal to " + param
	case "lt":
		return field + " must be less than " + param
	case "lte":
		return field + " must be less than or equal to " + param
	case "omitempty":
		return "" // 这个tag不产生错误信息
	default:
		return field + " is invalid"
	}
}

// GetValidatedReq 从context中获取验证后的请求
func GetValidatedReq(r *http.Request, req interface{}) bool {
	validatedReq := r.Context().Value("validatedReq")
	if validatedReq == nil {
		return false
	}

	// 使用反射将验证后的请求复制到目标结构体
	srcValue := reflect.ValueOf(validatedReq)
	dstValue := reflect.ValueOf(req)

	if srcValue.Kind() == reflect.Ptr {
		srcValue = srcValue.Elem()
	}
	if dstValue.Kind() == reflect.Ptr {
		dstValue = dstValue.Elem()
	}

	if srcValue.Type() != dstValue.Type() {
		return false
	}

	reflect.Copy(dstValue, srcValue)
	return true
}