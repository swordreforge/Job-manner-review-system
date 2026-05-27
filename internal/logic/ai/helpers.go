package ai

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	apperrors "career-api/common/errors"
	"career-api/internal/svc"

	"github.com/zeromicro/go-zero/core/logx"
)

type currentUser struct {
	id   int64
	role string
	name string
}

func resolveCurrentUser(ctx context.Context) (currentUser, error) {
	userID, ok := ctx.Value("userId").(int64)
	if !ok || userID <= 0 {
		return currentUser{}, &apperrors.CodeError{Code: apperrors.CodeUnauthorized, Msg: "unauthorized"}
	}
	role, _ := ctx.Value("role").(string)
	if role == "" {
		role = "student"
	}
	name, _ := ctx.Value("userName").(string)
	if name == "" {
		name = "用户"
	}
	return currentUser{id: userID, role: role, name: name}, nil
}

func getDB(ctx context.Context, svcCtx *svc.ServiceContext) (*sql.DB, error) {
	db, err := svcCtx.DB.RawDB()
	if err != nil {
		logx.Errorf("get db failed: %v", err)
		return nil, err
	}
	return db, nil
}

func getUserSchoolID(ctx context.Context, db *sql.DB, userID int64) (int64, error) {
	var schoolID sql.NullInt64
	if err := db.QueryRowContext(ctx, `SELECT school_id FROM users WHERE id = ? LIMIT 1`, userID).Scan(&schoolID); err != nil {
		return 0, fmt.Errorf("school not found")
	}
	if !schoolID.Valid || schoolID.Int64 <= 0 {
		return 0, fmt.Errorf("school not found")
	}
	return schoolID.Int64, nil
}

func nowUnix() int64 {
	return time.Now().Unix()
}

func normalizeUserType(role string) string {
	switch strings.ToLower(role) {
	case "teacher":
		return "teacher"
	default:
		return "student"
	}
}

const systemPrompt = `你是一名专业的求职顾问AI助手，名为"职途助手"。你的职责是：

1. 求职指导：帮助用户了解不同行业、岗位的发展前景和要求
2. 简历优化：帮助用户完善简历内容，突出个人优势
3. 面试技巧：提供面试准备建议，模拟面试场景
4. 职业规划：帮助用户制定短期和长期职业目标
5. 行业动态：分享行业趋势和就业市场信息

回答要求：
- 使用中文回复
- 给出具体、可操作的建议
- 如果用户的问题不明确，适当追问
- 保持友好、专业的语气
- 不要编造虚假信息，如果不确定，坦诚说明

每次回复控制在500字以内，聚焦核心要点。如果问题复杂，可以分点阐述。`

func getInterviewSystemPrompt(mode string) string {
	basePrompt := `你是一名专业的面试官，正在对候选人进行面试。

**重要：每次回复都必须提出一个新的面试问题，不能省略question字段！**

面试流程和问题类型：
1. 自我介绍阶段（第1-2题）：要求候选人做自我介绍
   - "请简单介绍一下你自己"
   - "请详细介绍一下你的技术背景和项目经验"

2. 项目经验阶段（第3-4题）：询问候选人参与的项目
   - "请详细介绍你最得意的一个项目，你在其中扮演什么角色？"
   - "你在项目中遇到的最大挑战是什么？如何解决的？"

3. 技术深度阶段（第5-6题）：针对技术栈进行深入提问
   - "你提到了使用Go语言，能详细讲讲Go的协程调度机制吗？"
   - "请解释一下XX技术的核心原理和适用场景"

4. 系统设计阶段（第7题）：询问系统架构、设计思路
   - "如果让你设计一个高并发的消息队列系统，你会如何设计？"
   - "如何设计一个秒杀系统来应对高并发？"

5. 场景问题阶段（第8题）：给出具体场景，询问解决方案
   - "如果你的服务突然崩溃，你会如何排查和解决？"
   - "如何处理数据库的死锁问题？"

6. HR阶段（可选）：询问薪资期望、职业规划等
   - "你对我们公司有什么了解？为什么想加入我们？"
   - "你未来3-5年的职业规划是什么？"

**每次都要根据回答内容提出新的、针对性的问题！**

评分标准：
- 技术能力（30分）：技术深度、广度、应用能力
- 沟通表达（30分）：表达能力、逻辑清晰度
- 项目经验（25分）：项目质量、责任范围
- 综合素质（15分）：学习能力、团队合作等

请严格按照JSON格式返回：
{
  "question": "你的下一个面试问题（必须包含具体的问题内容）",
  "score": 对用户回答的评分（0-100）,
  "feedback": "对用户回答的反馈建议",
  "questionType": "问题类型（self_intro/project/technical/design/scenario/hr）",
  "sessionEnd": false
}

**记住：**
- 每次都要提出新的问题，不能省略！
- 问题要具体、有针对性，体现专业性
- 5-8个问题后可以结束面试
- 返回纯JSON，不要有任何其他文字或markdown标记`

	if mode == "assessment" {
		basePrompt += "\n\n当前是评估模式（大厂技术面）：\n- 更加严格地评分\n- 重点关注技术深度和实际能力\n- 问题难度较高，要求深入分析\n- 期望回答具体、准确、有深度"
	} else {
		basePrompt += "\n\n当前是练习模式（国企综合面）：\n- 以鼓励为主，帮助用户提升面试技巧\n- 重点关注综合素质和表达能力\n- 问题难度适中，循序渐进\n- 提供更多改进建议和指导"
	}

	return basePrompt
}

func extractTextFromPartialJSON(partial string) string {
	var result strings.Builder
	inString := false
	escaped := false
	inTargetValue := false
	targetKeys := map[string]bool{"question": true, "feedback": true}

	for i := 0; i < len(partial); i++ {
		ch := partial[i]

		if escaped {
			if inTargetValue {
				result.WriteByte(ch)
			}
			escaped = false
			continue
		}

		if ch == '\\' && inString {
			escaped = true
			continue
		}

		if ch == '"' {
			if !inString {
				j := i - 1
				for j >= 0 && (partial[j] == ' ' || partial[j] == '\t' || partial[j] == '\n' || partial[j] == '\r') {
					j--
				}
				if j >= 0 && partial[j] == ':' {
					k := j - 1
					for k >= 0 && partial[k] == ' ' {
						k--
					}
					if k >= 0 && partial[k] == '"' {
						start := k - 1
						for start >= 0 && partial[start] != '"' {
							start--
						}
						if start >= 0 {
							currentKey := partial[start+1 : k]
							inTargetValue = targetKeys[currentKey]
						}
					}
				}
				inString = true
			} else {
				inString = false
				inTargetValue = false
			}
			continue
		}

		if inTargetValue {
			result.WriteByte(ch)
		}
	}

	return result.String()
}