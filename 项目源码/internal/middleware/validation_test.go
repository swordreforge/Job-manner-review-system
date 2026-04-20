package middleware

import (
	"testing"

	"career-api/internal/types"

	"github.com/stretchr/testify/assert"
)

func TestValidationMiddleware_Validate(t *testing.T) {
	middleware := NewValidationMiddleware()

	t.Run("Valid RegisterReq", func(t *testing.T) {
		req := types.RegisterReq{
			Username: "testuser",
			Password: "password123",
			Email:    "test@example.com",
			Phone:    "13800138000",
		}

		err := middleware.Validate(&req)
		assert.NoError(t, err)
	})

	t.Run("Invalid RegisterReq - Short Username", func(t *testing.T) {
		req := types.RegisterReq{
			Username: "ab",
			Password: "password123",
			Email:    "test@example.com",
		}

		err := middleware.Validate(&req)
		assert.Error(t, err)
	})

	t.Run("Invalid RegisterReq - Short Password", func(t *testing.T) {
		req := types.RegisterReq{
			Username: "testuser",
			Password: "12345",
			Email:    "test@example.com",
		}

		err := middleware.Validate(&req)
		assert.Error(t, err)
	})

	t.Run("Invalid RegisterReq - Invalid Email", func(t *testing.T) {
		req := types.RegisterReq{
			Username: "testuser",
			Password: "password123",
			Email:    "invalid-email",
		}

		err := middleware.Validate(&req)
		assert.Error(t, err)
	})

	t.Run("Invalid RegisterReq - Invalid Phone Length", func(t *testing.T) {
		req := types.RegisterReq{
			Username: "testuser",
			Password: "password123",
			Email:    "test@example.com",
			Phone:    "12345",
		}

		err := middleware.Validate(&req)
		assert.Error(t, err)
	})

	t.Run("Valid LoginReq", func(t *testing.T) {
		req := types.LoginReq{
			Username: "testuser",
			Password: "password123",
		}

		err := middleware.Validate(&req)
		assert.NoError(t, err)
	})

	t.Run("Invalid LoginReq - Missing Username", func(t *testing.T) {
		req := types.LoginReq{
			Username: "",
			Password: "password123",
		}

		err := middleware.Validate(&req)
		assert.Error(t, err)
	})

	t.Run("Invalid LoginReq - Missing Password", func(t *testing.T) {
		req := types.LoginReq{
			Username: "testuser",
			Password: "",
		}

		err := middleware.Validate(&req)
		assert.Error(t, err)
	})

	t.Run("Valid CreateStudentReq", func(t *testing.T) {
		req := types.CreateStudentReq{
			Name:           "张三",
			Education:      "bachelor",
			Major:          "计算机科学与技术",
			GraduationYear: 2026,
		}

		err := middleware.Validate(&req)
		assert.NoError(t, err)
	})

	t.Run("Invalid CreateStudentReq - Short Name (when provided)", func(t *testing.T) {
		req := types.CreateStudentReq{
			Name: "张", // 只有一个字符，小于min=2
		}

		err := middleware.Validate(&req)
		assert.Error(t, err)
	})

	t.Run("Invalid CreateStudentReq - Invalid Education (when provided)", func(t *testing.T) {
		req := types.CreateStudentReq{
			Name:      "张三",
			Education: "invalid_education", // 不在oneof列表中
		}

		err := middleware.Validate(&req)
		assert.Error(t, err)
	})

	t.Run("Invalid CreateStudentReq - Invalid GraduationYear (when provided)", func(t *testing.T) {
		req := types.CreateStudentReq{
			Name:           "张三",
			GraduationYear: 2019, // 小于min=2020
		}

		err := middleware.Validate(&req)
		assert.Error(t, err)
	})

	t.Run("Valid CreateJobReq", func(t *testing.T) {
		req := types.CreateJobReq{
			Name:        "软件工程师",
			Description: "负责软件开发和维护",
			Company:     "科技公司",
			Industry:    "互联网",
			Location:    "北京",
		}

		err := middleware.Validate(&req)
		assert.NoError(t, err)
	})

	t.Run("Invalid CreateJobReq - Short Name (when provided)", func(t *testing.T) {
		req := types.CreateJobReq{
			Name: "软", // 只有一个字符，小于min=2
		}

		err := middleware.Validate(&req)
		assert.Error(t, err)
	})

	t.Run("Invalid CreateJobReq - Long Description (when provided)", func(t *testing.T) {
		req := types.CreateJobReq{
			Name:        "软件工程师",
			Description: generateLongString(2001), // 超过max=2000字符
		}

		err := middleware.Validate(&req)
		assert.Error(t, err)
	})

	t.Run("Valid GenerateReportReq", func(t *testing.T) {
		req := types.GenerateReportReq{
			StudentId: 1,
		}

		err := middleware.Validate(&req)
		assert.NoError(t, err)
	})

	t.Run("Invalid GenerateReportReq - Missing StudentId", func(t *testing.T) {
		req := types.GenerateReportReq{
			StudentId: 0,
		}

		err := middleware.Validate(&req)
		assert.Error(t, err)
	})

	t.Run("Valid UpdateReportReq", func(t *testing.T) {
		req := types.UpdateReportReq{
			Id:     1,
			Title:  "职业发展报告",
			Status: "completed",
		}

		err := middleware.Validate(&req)
		assert.NoError(t, err)
	})

	t.Run("Invalid UpdateReportReq - Missing Id", func(t *testing.T) {
		req := types.UpdateReportReq{
			Id:     0, // 小于gt=0
			Title:  "职业发展报告",
			Status: "completed",
		}

		err := middleware.Validate(&req)
		assert.Error(t, err)
	})

	t.Run("Invalid UpdateReportReq - Invalid Status (when provided)", func(t *testing.T) {
		req := types.UpdateReportReq{
			Id:     1,
			Title:  "职业发展报告",
			Status: "invalid_status", // 不在oneof列表中
		}

		err := middleware.Validate(&req)
		assert.Error(t, err)
	})

	t.Run("Valid MatchReq", func(t *testing.T) {
		req := types.MatchReq{
			StudentId: 1,
			JobId:     1,
		}

		err := middleware.Validate(&req)
		assert.NoError(t, err)
	})

	t.Run("Invalid MatchReq - Missing StudentId", func(t *testing.T) {
		req := types.MatchReq{
			StudentId: 0, // 小于gt=0
			JobId:     1,
		}

		err := middleware.Validate(&req)
		assert.Error(t, err)
	})

	t.Run("Invalid MatchReq - Missing JobId", func(t *testing.T) {
		req := types.MatchReq{
			StudentId: 1,
			JobId:     0, // 小于gt=0
		}

		err := middleware.Validate(&req)
		assert.Error(t, err)
	})

	
}

func TestValidationMiddleware_FormatValidationErrors(t *testing.T) {
	middleware := NewValidationMiddleware()

	t.Run("Format Required Error", func(t *testing.T) {
		req := types.RegisterReq{
			Username: "",
		}

		err := middleware.Validate(&req)
		assert.Error(t, err)

		errors := middleware.formatValidationErrors(err)
		assert.NotEmpty(t, errors)
		assert.Equal(t, "Username", errors[0]["field"])
		assert.Equal(t, "required", errors[0]["tag"])
	})

	t.Run("Format Min Error", func(t *testing.T) {
		req := types.RegisterReq{
			Username: "ab",
			Password: "password123",
			Email:    "test@example.com",
		}

		err := middleware.Validate(&req)
		assert.Error(t, err)

		errors := middleware.formatValidationErrors(err)
		assert.NotEmpty(t, errors)
		assert.Equal(t, "Username", errors[0]["field"])
		assert.Equal(t, "min", errors[0]["tag"])
	})

	t.Run("Format Email Error", func(t *testing.T) {
		req := types.RegisterReq{
			Username: "testuser",
			Password: "password123",
			Email:    "invalid-email",
		}

		err := middleware.Validate(&req)
		assert.Error(t, err)

		errors := middleware.formatValidationErrors(err)
		assert.NotEmpty(t, errors)
		assert.Equal(t, "Email", errors[0]["field"])
		assert.Equal(t, "email", errors[0]["tag"])
	})
}

func TestValidationMiddleware_GetErrorMessage(t *testing.T) {
	middleware := NewValidationMiddleware()

	t.Run("Required message", func(t *testing.T) {
		// 通过实际验证来测试错误消息
		req := types.RegisterReq{
			Username: "",
			Password: "password123",
			Email:    "test@example.com",
		}

		err := middleware.Validate(&req)
		assert.Error(t, err)

		errors := middleware.formatValidationErrors(err)
		assert.NotEmpty(t, errors)
		assert.Contains(t, errors[0]["message"], "Username is required")
	})

	t.Run("Min message", func(t *testing.T) {
		req := types.RegisterReq{
			Username: "ab",
			Password: "password123",
			Email:    "test@example.com",
		}

		err := middleware.Validate(&req)
		assert.Error(t, err)

		errors := middleware.formatValidationErrors(err)
		assert.NotEmpty(t, errors)
		assert.Contains(t, errors[0]["message"], "Username must be at least")
	})

	t.Run("Email message", func(t *testing.T) {
		req := types.RegisterReq{
			Username: "testuser",
			Password: "password123",
			Email:    "invalid-email",
		}

		err := middleware.Validate(&req)
		assert.Error(t, err)

		errors := middleware.formatValidationErrors(err)
		assert.NotEmpty(t, errors)
		assert.Contains(t, errors[0]["message"], "Email must be a valid email address")
	})
}

// Helper function to generate long string
func generateLongString(length int) string {
	result := ""
	for i := 0; i < length; i++ {
		result += "a"
	}
	return result
}