package pkg

import (
	"crypto/rand"
	"math/big"
)

const schoolCodeCharset = "0123456789ABCDEFGHJKMNPQRSTUVWXYZ"

func GenerateSchoolCode() string {
	charset := schoolCodeCharset
	charsetLen := len(charset)

	code := make([]byte, 6)
	for i := range code {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(charsetLen)))
		code[i] = charset[n.Int64()]
	}

	checkDigit := calculateSchoolCheckDigit(code, charset)
	code = append(code, checkDigit)

	return "SCH" + string(code)
}

func calculateSchoolCheckDigit(data []byte, charset string) byte {
	sum := 0
	charsetLen := len(charset)
	for i, b := range data {
		pos := -1
		for j := 0; j < charsetLen; j++ {
			if charset[j] == b {
				pos = j
				break
			}
		}
		if pos >= 0 {
			sum += pos * (i + 1)
		}
	}
	idx := sum % charsetLen
	return charset[idx]
}

func ValidateSchoolCode(code string) bool {
	if len(code) != 10 {
		return false
	}
	if len(code) < 4 || code[:3] != "SCH" {
		return false
	}

	data := []byte(code[3:9])
	checkDigit := code[9]
	expectedDigit := calculateSchoolCheckDigit(data, schoolCodeCharset)
	return checkDigit == expectedDigit
}
