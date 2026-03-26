package user

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/stretchr/testify/assert"
)

// 注意：这些测试主要验证验证功能是否在Handler中被正确调用
// 由于验证逻辑在验证失败时就会返回，所以不需要完整的ServiceContext
// 我们只测试验证失败的情况，验证成功的情况需要完整的数据库设置

func TestRegisterHandler_ValidationErrors(t *testing.T) {
	// 创建测试服务上下文（虽然会被验证拦截，但仍需要提供）
	svcCtx := &svc.ServiceContext{}

	tests := []struct {
		name         string
		requestBody  interface{}
		expectStatus int
	}{
		{
			name: "Short Username",
			requestBody: types.RegisterReq{
				Username: "ab",
				Password: "password123",
				Email:    "test@example.com",
			},
			expectStatus: 400,
		},
		{
			name: "Short Password",
			requestBody: types.RegisterReq{
				Username: "testuser",
				Password: "12345",
				Email:    "test@example.com",
			},
			expectStatus: 400,
		},
		{
			name: "Invalid Email",
			requestBody: types.RegisterReq{
				Username: "testuser",
				Password: "password123",
				Email:    "invalid-email",
			},
			expectStatus: 400,
		},
		{
			name: "Invalid Phone Length",
			requestBody: types.RegisterReq{
				Username: "testuser",
				Password: "password123",
				Email:    "test@example.com",
				Phone:    "12345",
			},
			expectStatus: 400,
		},
		{
			name: "Missing Required Fields",
			requestBody: types.RegisterReq{
				Username: "",
				Password: "",
				Email:    "",
			},
			expectStatus: 400,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 创建请求
			body, _ := json.Marshal(tt.requestBody)
			req := httptest.NewRequest(http.MethodPost, "/api/v1/user/register", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")

			// 创建响应记录器
			w := httptest.NewRecorder()

			// 调用Handler
			handler := RegisterHandler(svcCtx)
			handler(w, req)

			// 验证响应状态码
			assert.Equal(t, tt.expectStatus, w.Code)

			// 验证错误响应格式
			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			assert.NoError(t, err)
			assert.Equal(t, float64(400), resp["code"])
			assert.Equal(t, "validation failed", resp["msg"])
			assert.NotEmpty(t, resp["errors"])
		})
	}
}

func TestLoginHandler_ValidationErrors(t *testing.T) {
	// 创建测试服务上下文
	svcCtx := &svc.ServiceContext{}

	tests := []struct {
		name         string
		requestBody  interface{}
		expectStatus int
	}{
		{
			name: "Missing Username",
			requestBody: types.LoginReq{
				Username: "",
				Password: "password123",
			},
			expectStatus: 400,
		},
		{
			name: "Missing Password",
			requestBody: types.LoginReq{
				Username: "testuser",
				Password: "",
			},
			expectStatus: 400,
		},
		{
			name: "Missing Both Fields",
			requestBody: types.LoginReq{
				Username: "",
				Password: "",
			},
			expectStatus: 400,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 创建请求
			body, _ := json.Marshal(tt.requestBody)
			req := httptest.NewRequest(http.MethodPost, "/api/v1/user/login", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")

			// 创建响应记录器
			w := httptest.NewRecorder()

			// 调用Handler
			handler := LoginHandler(svcCtx)
			handler(w, req)

			// 验证响应状态码
			assert.Equal(t, tt.expectStatus, w.Code)

			// 验证错误响应格式
			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			assert.NoError(t, err)
			assert.Equal(t, float64(400), resp["code"])
			assert.Equal(t, "validation failed", resp["msg"])
			assert.NotEmpty(t, resp["errors"])
		})
	}
}

func TestUpdateUserInfoHandler_ValidationErrors(t *testing.T) {
	// 创建测试服务上下文
	svcCtx := &svc.ServiceContext{}

	tests := []struct {
		name         string
		requestBody  interface{}
		expectStatus int
	}{
		{
			name: "Invalid Email",
			requestBody: types.UpdateUserReq{
				Email: "invalid-email",
			},
			expectStatus: 400,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 创建请求
			body, _ := json.Marshal(tt.requestBody)
			req := httptest.NewRequest(http.MethodPut, "/api/v1/user/info", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")

			// 创建响应记录器
			w := httptest.NewRecorder()

			// 调用Handler
			handler := UpdateUserInfoHandler(svcCtx)
			handler(w, req)

			// 验证响应状态码
			assert.Equal(t, tt.expectStatus, w.Code)

			// 验证错误响应格式
			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			assert.NoError(t, err)
			assert.Equal(t, float64(400), resp["code"])
			assert.Equal(t, "validation failed", resp["msg"])
			assert.NotEmpty(t, resp["errors"])
		})
	}
}

// 测试验证中间件是否被正确调用
// 这个测试验证验证逻辑在Handler中被正确触发
func TestValidationMiddlewareIntegration(t *testing.T) {
	// 创建验证中间件实例
	svcCtx := &svc.ServiceContext{}

	// 测试1：验证注册请求 - 短用户名应该被拦截
	t.Run("RegisterHandler - Short Username Blocked", func(t *testing.T) {
		body, _ := json.Marshal(types.RegisterReq{
			Username: "ab",
			Password: "password123",
			Email:    "test@example.com",
		})
		req := httptest.NewRequest(http.MethodPost, "/api/v1/user/register", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		handler := RegisterHandler(svcCtx)
		handler(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Equal(t, float64(400), resp["code"])
		assert.Equal(t, "validation failed", resp["msg"])

		// 验证错误信息包含Username字段
		errors := resp["errors"].([]interface{})
		assert.NotEmpty(t, errors)
	})

	// 测试2：验证登录请求 - 缺少密码应该被拦截
	t.Run("LoginHandler - Missing Password Blocked", func(t *testing.T) {
		body, _ := json.Marshal(types.LoginReq{
			Username: "testuser",
			Password: "",
		})
		req := httptest.NewRequest(http.MethodPost, "/api/v1/user/login", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		handler := LoginHandler(svcCtx)
		handler(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Equal(t, float64(400), resp["code"])
		assert.Equal(t, "validation failed", resp["msg"])
	})
}