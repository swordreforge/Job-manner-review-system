// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package report

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"career-api/internal/model"
	"career-api/internal/svc"
	"career-api/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GenerateReportStreamLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

type SSEEvent struct {
	Type    string      `json:"type"`
	Content interface{} `json:"content,omitempty"`
}

type ReportContent struct {
	Skills         []SkillItem     `json:"skills"`
	Timeline       []TimelineItem  `json:"timeline"`
	Completeness   float64         `json:"completeness"`
	Competitiveness float64        `json:"competitiveness"`
}

type SkillItem struct {
	Name   string `json:"name"`
	Level  int    `json:"level"`
	Status string `json:"status"`
}

type TimelineItem struct {
	Date  string `json:"date"`
	Title string `json:"title"`
	Desc  string `json:"desc"`
}

// Generate career report via SSE stream
func NewGenerateReportStreamLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GenerateReportStreamLogic {
	return &GenerateReportStreamLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GenerateReportStreamLogic) GenerateReportStream(req *types.GenerateReportStreamReq) error {
	// 获取 response writer 以发送 SSE 事件
	w, ok := l.ctx.Value("responseWriter").(http.ResponseWriter)
	if !ok {
		return fmt.Errorf("response writer not found in context")
	}

	// 设置 SSE 响应头
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Cache-Control")

	// 发送事件到客户端
	sendEvent := func(eventType string, content interface{}) {
		event := SSEEvent{
			Type:    eventType,
			Content: content,
		}
		data, _ := json.Marshal(event)
		fmt.Fprintf(w, "data: %s\n\n", data)
		if flusher, ok := w.(http.Flusher); ok {
			flusher.Flush()
		}
	}

	// 获取学生资料
	student, err := l.svcCtx.StudentModel.FindOne(l.ctx, req.StudentId)
	if err != nil {
		sendEvent("error", map[string]string{"message": "学生资料不存在"})
		return fmt.Errorf("student not found: %v", err)
	}

	// 根据不同的 track 生成不同的报告内容
	var reportContent ReportContent
	if req.Track == "full" {
		reportContent = l.generateFullReport(student)
	} else if req.Track == "quick" {
		reportContent = l.generateQuickReport(student)
	} else if req.Track == "gap" {
		reportContent = l.generateGapAnalysis(student)
	} else {
		reportContent = l.generateFullReport(student)
	}

	// 模拟流式发送数据
	sendEvent("progress", map[string]string{"message": "正在分析学生资料..."})
	time.Sleep(500 * time.Millisecond)

	sendEvent("progress", map[string]string{"message": "正在生成职业规划..."})
	time.Sleep(500 * time.Millisecond)

	sendEvent("progress", map[string]string{"message": "正在生成技能分析..."})
	time.Sleep(500 * time.Millisecond)

	// 发送完整的报告
	sendEvent("report", reportContent)

	// 保存报告到数据库
	l.saveReportToDatabase(student, reportContent, req.Track)

	return nil
}

func (l *GenerateReportStreamLogic) generateFullReport(student *model.Students) ReportContent {
	// 解析学生数据
	skills := make([]SkillItem, 0)
	if student.Skills != nil {
		skillsData := student.Skills.([]interface{})
		for _, s := range skillsData {
			if skillMap, ok := s.(map[string]interface{}); ok {
				name := fmt.Sprintf("%v", skillMap["name"])
				level := 0
				if l, ok := skillMap["level"].(float64); ok {
					level = int(l)
				}
				skills = append(skills, SkillItem{
					Name:   name,
					Level:  level * 20, // 转换为百分比
					Status: getStatus(level),
				})
			}
		}
	}

	// 如果没有技能数据，生成默认数据
	if len(skills) == 0 {
		skills = []SkillItem{
			{Name: "编程能力", Level: 75, Status: "已掌握"},
			{Name: "算法与数据结构", Level: 60, Status: "学习中"},
			{Name: "系统设计", Level: 40, Status: "待学习"},
			{Name: "沟通能力", Level: 70, Status: "已掌握"},
		}
	}

	timeline := []TimelineItem{
		{Date: "2024年Q3", Title: "学习基础技术栈", Desc: "掌握前端/后端基础，完成个人项目"},
		{Date: "2024年Q4", Title: "提升专业技能", Desc: "深入学习核心框架，参与开源项目"},
		{Date: "2025年Q1", Title: "准备实习面试", Desc: "刷题、完善简历，争取大厂实习机会"},
		{Date: "2025年Q2", Title: "积累实习经验", Desc: "在实际项目中应用所学知识"},
		{Date: "2025年Q3", Title: "秋招冲刺", Desc: "系统复习，准备校招面试"},
	}

	return ReportContent{
		Skills:         skills,
		Timeline:       timeline,
		Completeness:   65.0,
		Competitiveness: 58.0,
	}
}

func (l *GenerateReportStreamLogic) generateQuickReport(student *model.Students) ReportContent {
	skills := []SkillItem{
		{Name: "核心技能", Level: 70, Status: "已掌握"},
		{Name: "专业技能", Level: 50, Status: "学习中"},
	}

	timeline := []TimelineItem{
		{Date: "近期", Title: "快速提升", Desc: "重点突破核心技术"},
	}

	return ReportContent{
		Skills:         skills,
		Timeline:       timeline,
		Completeness:   50.0,
		Competitiveness: 45.0,
	}
}

func (l *GenerateReportStreamLogic) generateGapAnalysis(student *model.Students) ReportContent {
	skills := []SkillItem{
		{Name: "差距分析", Level: 30, Status: "待学习"},
	}

	timeline := []TimelineItem{
		{Date: "立即行动", Title: "弥补差距", Desc: "识别并强化薄弱环节"},
	}

	return ReportContent{
		Skills:         skills,
		Timeline:       timeline,
		Completeness:   40.0,
		Competitiveness: 35.0,
	}
}

func getStatus(level int) string {
	if level >= 4 {
		return "已掌握"
	} else if level >= 2 {
		return "学习中"
	}
	return "待学习"
}

func (l *GenerateReportStreamLogic) saveReportToDatabase(student *model.Students, content ReportContent, track string) {
	contentJson, _ := json.Marshal(content)
	
	_, err := l.svcCtx.ReportModel.Insert(l.ctx, &model.CareerReports{
		StudentId: student.UserId,
		Title:     fmt.Sprintf("职业规划报告 - %s", track),
		Content:   string(contentJson),
		Status:    "completed",
	})
	
	if err != nil {
		logx.Errorf("保存报告失败: %v", err)
	}
}
