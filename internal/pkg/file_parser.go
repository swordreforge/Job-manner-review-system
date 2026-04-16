package pkg

import (
	"archive/zip"
	"bytes"
	"encoding/csv"
	"fmt"
	"io"
	"os"
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

	// 将所有换行符替换为空格
	text = strings.ReplaceAll(text, "\n", " ")
	text = strings.ReplaceAll(text, "\r", " ")
	text = strings.ReplaceAll(text, "\t", " ")

	// 将多个连续空格替换为单个空格
	for strings.Contains(text, "  ") {
		text = strings.ReplaceAll(text, "  ", " ")
	}

	// 去除首尾空格
	return strings.TrimSpace(text)
}

// ExtractText 根据文件扩展名提取文本
func ExtractText(filePath string) (string, error) {
	ext := strings.ToLower(filePath)

	if strings.HasSuffix(ext, ".pdf") {
		return ExtractTextFromPDF(filePath)
	} else if strings.HasSuffix(ext, ".docx") {
		return ExtractTextFromDOCX(filePath)
	} else if strings.HasSuffix(ext, ".xlsx") {
		return ExtractTextFromXLSX(filePath)
	} else if strings.HasSuffix(ext, ".csv") {
		return ExtractTextFromCSV(filePath)
	}

	return "", fmt.Errorf("unsupported file format: %s", ext)
}

// ExtractTextFromXLSX 从 XLSX 文件提取文本（使用 ZIP 解析）
func ExtractTextFromXLSX(filePath string) (string, error) {
	r, err := zip.OpenReader(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open XLSX: %w", err)
	}
	defer r.Close()

	var buf bytes.Buffer

	// 首先读取共享字符串表
	sharedStrings := make(map[int]string)
	for _, file := range r.File {
		if file.Name == "xl/sharedStrings.xml" {
			rc, err := file.Open()
			if err == nil {
				defer rc.Close()
				content, _ := io.ReadAll(rc)
				sharedStrings = parseSharedStrings(string(content))
			}
			break
		}
	}

	// 然后读取工作表数据
	for _, file := range r.File {
		name := file.Name
		if strings.HasPrefix(name, "xl/worksheets/sheet") && strings.HasSuffix(name, ".xml") {
			rc, err := file.Open()
			if err != nil {
				continue
			}
			defer rc.Close()

			content, err := io.ReadAll(rc)
			if err != nil {
				continue
			}

			// 从 XML 提取文本内容（使用共享字符串映射）
			text := extractSheetFromXLSX(string(content), sharedStrings)
			if text != "" {
				buf.WriteString(text)
				buf.WriteString("\n")
			}
		}
	}

	if buf.Len() == 0 {
		return "", fmt.Errorf("no content found in XLSX")
	}

	return cleanText(buf.String()), nil
}

// parseSharedStrings 解析共享字符串表
func parseSharedStrings(content string) map[int]string {
	result := make(map[int]string)

	// 查找所有 <si> 标签块
	for {
		start := strings.Index(content, "<si>")
		if start == -1 {
			break
		}
		end := strings.Index(content[start:], "</si>")
		if end == -1 {
			break
		}

		siContent := content[start : start+end]
		var text strings.Builder

		// 在 <si> 中查找 <t> 标签的内容
		for {
			tStart := strings.Index(siContent, "<t")
			if tStart == -1 {
				break
			}
			tEnd := strings.Index(siContent[tStart:], ">")
			if tEnd == -1 {
				break
			}

			// 找到闭合 </t>
			textStart := tStart + tEnd + 1
			textEnd := strings.Index(siContent[textStart:], "</t>")
			if textEnd == -1 {
				break
			}

			text.WriteString(strings.TrimSpace(siContent[textStart : textStart+textEnd]))
			siContent = siContent[textStart+textEnd:]
		}

		// 找到这个字符串的索引
		idxStart := strings.Index(content[:start], "<si")
		if idxStart != -1 {
			// 提取 t 标签前的数字作为索引
			idx := 0
			for i := idxStart + 3; i < start && content[i] >= '0' && content[i] <= '9'; i++ {
				idx = idx*10 + int(content[i]-'0')
			}
			if text.Len() > 0 {
				result[idx] = text.String()
			}
		}

		content = content[start+end+5:]
	}

	return result
}

// extractSheetFromXLSX 从工作表 XML 提取数据
func extractSheetFromXLSX(content string, sharedStrings map[int]string) string {
	var result strings.Builder

	// 直接提取所有 <c> 标签内的值
	// 格式: <c r="A1" t="inlineStr"><is><t>Job ID</t></is></c>
	// 或: <c r="A1"><v>1</v></c>
	for {
		// 查找单元格开始
		cStart := strings.Index(content, "<c ")
		if cStart == -1 {
			cStart = strings.Index(content, "<c>")
			if cStart == -1 {
				break
			}
			cStart += 3
		}

		// 查找单元格结束 </c>
		cEnd := strings.Index(content[cStart:], "</c>")
		if cEnd == -1 {
			break
		}

		cellContent := content[cStart : cStart+cEnd]

		var cellValue string

		// 优先检查内联字符串: <is><t>...</t></is>
		isStart := strings.Index(cellContent, "<is>")
		if isStart != -1 {
			isEnd := strings.Index(cellContent[isStart:], "</is>")
			if isEnd != -1 {
				isContent := cellContent[isStart+4 : isStart+isEnd]
				tStart := strings.Index(isContent, "<t>")
				if tStart != -1 {
					tEnd := strings.Index(isContent[tStart:], "</t>")
					if tEnd != -1 {
						cellValue = strings.TrimSpace(isContent[tStart+3 : tStart+tEnd])
					}
				}
			}
		}

		// 如果没有内联字符串，检查 <v> 值
		if cellValue == "" {
			vStart := strings.Index(cellContent, "<v>")
			if vStart != -1 {
				vEnd := strings.Index(cellContent[vStart:], "</v>")
				if vEnd != -1 {
					val := cellContent[vStart+3 : vStart+vEnd]
					val = strings.TrimSpace(val)

					// 检查��否是共享字符串索引 (t="s")
					if strings.Contains(cellContent, `t="s"`) {
						idx := 0
						for _, c := range val {
							if c >= '0' && c <= '9' {
								idx = idx*10 + int(c-'0')
							}
						}
						if str, ok := sharedStrings[idx]; ok {
							cellValue = str
						}
					} else {
						cellValue = val
					}
				}
			}
		}

		if cellValue != "" {
			result.WriteString(cellValue)
			result.WriteString("\t")
		}

		content = content[cStart+cEnd+3:]
	}

	return result.String()
}

// extractTextFromXLSXXML 从 XLSX XML 内容提取文本
func extractTextFromXLSXXML(content string) string {
	var result strings.Builder

	// 提取 <v>...</v> 之间的内容（单元格值）
	for {
		start := strings.Index(content, "<v>")
		if start == -1 {
			break
		}
		end := strings.Index(content[start:], "</v>")
		if end == -1 {
			break
		}
		text := content[start+3 : start+end]
		text = strings.TrimSpace(text)
		if text != "" {
			result.WriteString(text)
			result.WriteString("\t")
		}
		content = content[start+end+4:]
	}

	// 也提取 <t>...</t> 之间的内容（内联文本）
	for {
		start := strings.Index(content, "<t>")
		if start == -1 {
			break
		}
		end := strings.Index(content[start:], "</t>")
		if end == -1 {
			break
		}
		text := content[start+3 : start+end]
		text = strings.TrimSpace(text)
		if text != "" {
			result.WriteString(text)
			result.WriteString("\t")
		}
		content = content[start+end+4:]
	}

	return result.String()
}

// ExtractTextFromCSV 从 CSV 文件提取文本
func ExtractTextFromCSV(filePath string) (string, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open CSV: %w", err)
	}
	defer f.Close()

	reader := csv.NewReader(f)

	var buf bytes.Buffer

	// 读取所有行
	records, err := reader.ReadAll()
	if err != nil {
		return "", fmt.Errorf("failed to read CSV: %w", err)
	}

	for _, record := range records {
		for _, field := range record {
			buf.WriteString(strings.TrimSpace(field))
			buf.WriteString("\t")
		}
		buf.WriteString("\n")
	}

	return cleanText(buf.String()), nil
}

// ParseCSVToRecords 解析 CSV 文件并返回结构化记录
func ParseCSVToRecords(filePath string) ([][]string, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open CSV: %w", err)
	}
	defer f.Close()

	reader := csv.NewReader(f)

	records, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to read CSV: %w", err)
	}

	return records, nil
}
