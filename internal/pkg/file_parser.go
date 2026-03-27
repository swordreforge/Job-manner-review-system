package pkg

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/ledongthuc/pdf"
	"github.com/nguyenthenguyen/docx"
)

// ExtractTextFromPDF 从 PDF 文件提取文本
func ExtractTextFromPDF(filePath string) (string, error) {
	f, r, err := pdf.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open PDF: %w", err)
	}
	defer f.Close()

	var buf bytes.Buffer
	b, err := r.GetPlainText()
	if err != nil {
		return "", fmt.Errorf("failed to get plain text: %w", err)
	}
	buf.ReadFrom(b)

	return buf.String(), nil
}

// ExtractTextFromDOCX 从 DOCX 文件提取文本
func ExtractTextFromDOCX(filePath string) (string, error) {
	r, err := docx.ReadDocxFile(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open DOCX: %w", err)
	}
	defer r.Close()

	docxContent := r.Editable()
	xmlContent := docxContent.GetContent()

	// 从 XML 中提取纯文本
	text := extractTextFromXML(xmlContent)

	return text, nil
}

// extractTextFromXML 从 DOCX XML 内容中提取纯文本
func extractTextFromXML(xmlContent string) string {
	var result strings.Builder
	content := xmlContent

	for {
		// 查找 <w:t> 标签的开始
		start := strings.Index(content, "<w:t")
		if start == -1 {
			break
		}

		// 找到 > 标记
		tagEnd := strings.Index(content[start:], ">")
		if tagEnd == -1 {
			break
		}

		// 文本内容的开始位置
		textStart := start + tagEnd + 1

		// 查找 </w:t> 标签
		end := strings.Index(content[textStart:], "</w:t>")
		if end == -1 {
			break
		}

		// 提取 <w:t> 和 </w:t> 之间的内容
		textContent := content[textStart : textStart+end]

		// 移除所有嵌套的 XML 标签
		cleanText := removeXMLTags(textContent)
		cleanText = strings.TrimSpace(cleanText)

		if cleanText != "" {
			result.WriteString(cleanText)
			result.WriteString("\n")
		}

		// 移动到下一个位置
		content = content[textStart+end+6:]
	}

	return strings.TrimSpace(result.String())
}

// removeXMLTags 移除字符串中的所有 XML 标签
func removeXMLTags(s string) string {
	var result strings.Builder
	inTag := false

	for _, r := range s {
		if r == '<' {
			inTag = true
		} else if r == '>' {
			inTag = false
		} else if !inTag {
			result.WriteRune(r)
		}
	}

	return result.String()
}

// ExtractText 根据文件扩展名提取文本
func ExtractText(filePath string) (string, error) {
	ext := strings.ToLower(filePath)

	if strings.HasSuffix(ext, ".pdf") {
		return ExtractTextFromPDF(filePath)
	} else if strings.HasSuffix(ext, ".docx") {
		return ExtractTextFromDOCX(filePath)
	}

	return "", fmt.Errorf("unsupported file format: %s", ext)
}