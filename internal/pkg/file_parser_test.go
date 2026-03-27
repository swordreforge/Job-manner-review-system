package pkg

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const testDir = "../../test"

func TestExtractTextFromPDF(t *testing.T) {
	tests := []struct {
		name      string
		filePath  string
		wantEmpty bool
		wantErr   bool
	}{
		{
			name:      "valid PDF file",
			filePath:  filepath.Join(testDir, "黑白设计通用国际贸易财务会计专业简历.pdf"),
			wantEmpty: false,
			wantErr:   false,
		},
		{
			name:      "another valid PDF file",
			filePath:  filepath.Join(testDir, "小清新粉色浅绿色通用简历.pdf"),
			wantEmpty: false,
			wantErr:   false,
		},
		{
			name:      "non-existent PDF file",
			filePath:  filepath.Join(testDir, "nonexistent.pdf"),
			wantEmpty: true,
			wantErr:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ExtractTextFromPDF(tt.filePath)

			if (err != nil) != tt.wantErr {
				t.Errorf("ExtractTextFromPDF() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if tt.wantEmpty && got != "" {
				t.Errorf("ExtractTextFromPDF() expected empty string, got non-empty")
			}

			if !tt.wantEmpty && got == "" {
				t.Errorf("ExtractTextFromPDF() expected non-empty string, got empty")
			}

			if !tt.wantEmpty && got != "" {
				// 验证提取的文本包含一些预期的关键词
				text := strings.ToLower(got)
				hasContent := strings.Contains(text, "简历") ||
					strings.Contains(text, "个人") ||
					strings.Contains(text, "教育") ||
					strings.Contains(text, "经历")
				if !hasContent {
					t.Logf("Extracted text preview (first 200 chars): %s", got[:min(200, len(got))])
				}
			}
		})
	}
}

func TestExtractTextFromDOCX(t *testing.T) {
	tests := []struct {
		name      string
		filePath  string
		wantEmpty bool
		wantErr   bool
	}{
		{
			name:      "valid DOCX file",
			filePath:  filepath.Join(testDir, "黑白设计通用国际贸易财务会计专业简历.docx"),
			wantEmpty: false,
			wantErr:   false,
		},
		{
			name:      "another valid DOCX file",
			filePath:  filepath.Join(testDir, "小清新粉色浅绿色通用简历.docx"),
			wantEmpty: false,
			wantErr:   false,
		},
		{
			name:      "non-existent DOCX file",
			filePath:  filepath.Join(testDir, "nonexistent.docx"),
			wantEmpty: true,
			wantErr:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ExtractTextFromDOCX(tt.filePath)

			if (err != nil) != tt.wantErr {
				t.Errorf("ExtractTextFromDOCX() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if tt.wantEmpty && got != "" {
				t.Errorf("ExtractTextFromDOCX() expected empty string, got non-empty")
			}

			if !tt.wantEmpty && got == "" {
				t.Errorf("ExtractTextFromDOCX() expected non-empty string, got empty")
			}

			if !tt.wantEmpty && got != "" {
				// 验证提取的文本包含一些预期的关键词
				text := strings.ToLower(got)
				hasContent := strings.Contains(text, "简历") ||
					strings.Contains(text, "个人") ||
					strings.Contains(text, "教育") ||
					strings.Contains(text, "经历")
				if !hasContent {
					t.Logf("Extracted text preview (first 200 chars): %s", got[:min(200, len(got))])
				}
			}
		})
	}
}

func TestExtractText(t *testing.T) {
	tests := []struct {
		name      string
		filePath  string
		wantEmpty bool
		wantErr   bool
	}{
		{
			name:      "PDF file",
			filePath:  filepath.Join(testDir, "黑白设计通用国际贸易财务会计专业简历.pdf"),
			wantEmpty: false,
			wantErr:   false,
		},
		{
			name:      "DOCX file",
			filePath:  filepath.Join(testDir, "小清新粉色浅绿色通用简历.docx"),
			wantEmpty: false,
			wantErr:   false,
		},
		{
			name:      "unsupported file format",
			filePath:  filepath.Join(testDir, "resume.txt"),
			wantEmpty: true,
			wantErr:   true,
		},
		{
			name:      "non-existent file",
			filePath:  filepath.Join(testDir, "nonexistent.pdf"),
			wantEmpty: true,
			wantErr:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ExtractText(tt.filePath)

			if (err != nil) != tt.wantErr {
				t.Errorf("ExtractText() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if tt.wantEmpty && got != "" {
				t.Errorf("ExtractText() expected empty string, got non-empty")
			}

			if !tt.wantEmpty && got == "" {
				t.Errorf("ExtractText() expected non-empty string, got empty")
			}

			if !tt.wantEmpty && !tt.wantErr && got != "" {
				// 验证提取的文本不是太短
				if len(got) < 50 {
					t.Errorf("ExtractText() extracted text too short: %d chars", len(got))
				}
			}
		})
	}
}

// TestExtractedTextQuality 测试提取文本的质量
func TestExtractedTextQuality(t *testing.T) {
	testFiles := []string{
		"黑白设计通用国际贸易财务会计专业简历.pdf",
		"黑白设计通用国际贸易财务会计专业简历.docx",
		"小清新粉色浅绿色通用简历.pdf",
		"小清新粉色浅绿色通用简历.docx",
	}

	// 创建输出目录
	outputDir := filepath.Join(testDir, "extracted")
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		t.Fatalf("Failed to create output directory: %v", err)
	}

	for _, fileName := range testFiles {
		t.Run(fileName, func(t *testing.T) {
			filePath := filepath.Join(testDir, fileName)
			text, err := ExtractText(filePath)

			if err != nil {
				t.Errorf("Failed to extract text from %s: %v", fileName, err)
				return
			}

			// 验证文本长度
			if len(text) < 100 {
				t.Errorf("Extracted text too short from %s: %d chars", fileName, len(text))
			}

			// 验证文本包含合理的字符（不应该全是乱码）
			validChars := 0
			for _, r := range text {
				if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= 0x4e00 && r <= 0x9fff) {
					validChars++
				}
			}
			validRatio := float64(validChars) / float64(len(text))
			if validRatio < 0.25 {
				t.Errorf("Extracted text from %s has too few valid characters: %.2f%%", fileName, validRatio*100)
			}

			t.Logf("File %s: extracted %d characters, valid ratio: %.2f%%", fileName, len(text), validRatio*100)
			t.Logf("Preview: %s", text[:min(200, len(text))])

			// 保存提取的文本到文件
			baseName := strings.TrimSuffix(fileName, filepath.Ext(fileName))
			outputFile := filepath.Join(outputDir, baseName+".txt")
			if err := os.WriteFile(outputFile, []byte(text), 0644); err != nil {
				t.Errorf("Failed to save extracted text to %s: %v", outputFile, err)
			} else {
				t.Logf("Saved extracted text to: %s", outputFile)
			}
		})
	}
}

// TestFileExists 测试测试文件是否存在
func TestFileExists(t *testing.T) {
	testFiles := []string{
		"黑白设计通用国际贸易财务会计专业简历.pdf",
		"黑白设计通用国际贸易财务会计专业简历.docx",
		"小清新粉色浅绿色通用简历.pdf",
		"小清新粉色浅绿色通用简历.docx",
	}

	for _, fileName := range testFiles {
		filePath := filepath.Join(testDir, fileName)
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			t.Errorf("Test file does not exist: %s", filePath)
		}
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}