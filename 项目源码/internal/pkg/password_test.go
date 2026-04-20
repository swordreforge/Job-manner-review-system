package pkg

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestHashPassword(t *testing.T) {
	password := "testpassword123"

	hash, err := HashPassword(password)

	assert.NoError(t, err)
	assert.NotEmpty(t, hash)
	assert.NotEqual(t, password, hash)
	assert.Greater(t, len(hash), 20)
}

func TestHashPassword_EmptyPassword(t *testing.T) {
	password := ""

	hash, err := HashPassword(password)

	assert.NoError(t, err)
	assert.NotEmpty(t, hash)
	assert.NotEqual(t, password, hash)
}

func TestCheckPassword_Correct(t *testing.T) {
	password := "correctpassword123"

	hash, err := HashPassword(password)
	assert.NoError(t, err)

	result := CheckPassword(password, hash)
	assert.True(t, result)
}

func TestCheckPassword_Wrong(t *testing.T) {
	password := "correctpassword123"
	wrongPassword := "wrongpassword123"

	hash, err := HashPassword(password)
	assert.NoError(t, err)

	result := CheckPassword(wrongPassword, hash)
	assert.False(t, result)
}

func TestCheckPassword_EmptyPassword(t *testing.T) {
	password := "correctpassword123"

	hash, err := HashPassword(password)
	assert.NoError(t, err)

	result := CheckPassword("", hash)
	assert.False(t, result)
}

func TestHashPassword_SamePasswordDifferentHash(t *testing.T) {
	password := "testpassword123"

	hash1, err1 := HashPassword(password)
	hash2, err2 := HashPassword(password)

	assert.NoError(t, err1)
	assert.NoError(t, err2)
	assert.NotEqual(t, hash1, hash2)

	// 两个hash都应该能验证密码
	assert.True(t, CheckPassword(password, hash1))
	assert.True(t, CheckPassword(password, hash2))
}

func TestCheckPassword_MultipleVerification(t *testing.T) {
	password := "testpassword123"

	hash, err := HashPassword(password)
	assert.NoError(t, err)

	// 多次验证都应该成功
	for i := 0; i < 10; i++ {
		result := CheckPassword(password, hash)
		assert.True(t, result)
	}
}

func TestHashPassword_SpecialCharacters(t *testing.T) {
	passwords := []string{
		"password!@#$%^&*()",
		"密码123",
		"p@ssw0rd_2026",
		"12345678",
		"aBcDeFgH",
		"🔐password🔑",
	}

	for _, password := range passwords {
		hash, err := HashPassword(password)
		assert.NoError(t, err)
		assert.NotEmpty(t, hash)
		assert.NotEqual(t, password, hash)
		assert.True(t, CheckPassword(password, hash))
	}
}

func TestCheckPassword_EmptyHash(t *testing.T) {
	password := "testpassword123"

	result := CheckPassword(password, "")
	assert.False(t, result)
}

func TestCheckPassword_InvalidHash(t *testing.T) {
	password := "testpassword123"

	result := CheckPassword(password, "invalidhash")
	assert.False(t, result)
}

func TestHashPassword_LongPassword(t *testing.T) {
	// bcrypt的最大密码长度是72字节
	password := "a"
	for i := 0; i < 71; i++ {
		password += "a"
	}

	hash, err := HashPassword(password)

	assert.NoError(t, err)
	assert.NotEmpty(t, hash)
	assert.True(t, CheckPassword(password, hash))
}

func TestHashPassword_ExceedMaxLength(t *testing.T) {
	// bcrypt的最大密码长度是72字节，超过会返回错误
	password := "a"
	for i := 0; i < 100; i++ {
		password += "a"
	}

	hash, err := HashPassword(password)

	assert.Error(t, err)
	assert.Empty(t, hash)
}

func TestHashPassword_ShortPassword(t *testing.T) {
	passwords := []string{"a", "ab", "abc"}

	for _, password := range passwords {
		hash, err := HashPassword(password)
		assert.NoError(t, err)
		assert.NotEmpty(t, hash)
		assert.True(t, CheckPassword(password, hash))
	}
}

func TestCheckPassword_SimilarPasswords(t *testing.T) {
	password1 := "password123"
	password2 := "password124"
	password3 := "Password123"

	hash, err := HashPassword(password1)
	assert.NoError(t, err)

	assert.True(t, CheckPassword(password1, hash))
	assert.False(t, CheckPassword(password2, hash))
	assert.False(t, CheckPassword(password3, hash))
}

func TestHashPassword_ConsecutiveHashes(t *testing.T) {
	password := "testpassword123"

	hash1, err1 := HashPassword(password)
	assert.NoError(t, err1)
	assert.True(t, CheckPassword(password, hash1))

	hash2, err2 := HashPassword(password)
	assert.NoError(t, err2)
	assert.True(t, CheckPassword(password, hash2))

	hash3, err3 := HashPassword(password)
	assert.NoError(t, err3)
	assert.True(t, CheckPassword(password, hash3))

	// 验证生成的hash都不相同
	assert.NotEqual(t, hash1, hash2)
	assert.NotEqual(t, hash2, hash3)
	assert.NotEqual(t, hash1, hash3)
}