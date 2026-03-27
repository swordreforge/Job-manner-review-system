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

	// 清理提取的文本
	return cleanText(buf.String()), nil
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

	// 清理提取的文本
	return cleanText(text), nil
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

// cleanText 清理文本，去除多余空行、空格和转义字符
func cleanText(text string) string {
	// 替换转义字符
	text = strings.ReplaceAll(text, "&quot;", `"`)
	text = strings.ReplaceAll(text, "&amp;", "&")
	text = strings.ReplaceAll(text, "&lt;", "<")
	text = strings.ReplaceAll(text, "&gt;", ">")
	text = strings.ReplaceAll(text, "&apos;", "'")
	text = strings.ReplaceAll(text, "&#34;", `"`)
	text = strings.ReplaceAll(text, "&#38;", "&")
	text = strings.ReplaceAll(text, "&#60;", "<")
	text = strings.ReplaceAll(text, "&#62;", ">")
	text = strings.ReplaceAll(text, "&#39;", "'")

	// 将多个连续空格替换为单个空格
	spaceRegex := strings.Builder{}
	for i := 0; i < 10; i++ {
		spaceRegex.WriteString(" ")
	}
	for len(spaceRegex.String()) > 1 {
		text = strings.ReplaceAll(text, spaceRegex.String(), " ")
		spaceRegex.Reset()
		for i := 0; i < len(spaceRegex.String())-1; i++ {
			spaceRegex.WriteString(" ")
		}
	}

	// 清理每行的前后空格
	lines := strings.Split(text, "\n")
	cleanedLines := make([]string, 0, len(lines))

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line != "" {
			cleanedLines = append(cleanedLines, line)
		}
	}

	// 重新组合，保留段落分隔（单个空行）
	var result strings.Builder
	for i, line := range cleanedLines {
		if i > 0 {
			result.WriteString("\n")
		}
		result.WriteString(line)
	}

	return strings.TrimSpace(result.String())
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