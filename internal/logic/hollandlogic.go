package logic

import (
	"context"
	"database/sql"
	"encoding/json"
	"os"
	"sort"
	"time"

	"github.com/zeromicro/go-zero/core/logx"

	"career-api/common/errors"
	"career-api/internal/model"
	"career-api/internal/svc"
	"career-api/internal/types"
)

type GetHollandQuestionsLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetHollandQuestionsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetHollandQuestionsLogic {
	return &GetHollandQuestionsLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetHollandQuestionsLogic) GetHollandQuestions() (*types.GetHollandQuestionsResp, error) {
	// 从JSON文件中加载测试数据
	testData, err := loadHollandTestData()
	if err != nil {
		logx.Errorf("Failed to load holland test data: %v", err)
		return &types.GetHollandQuestionsResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to load test data",
		}, nil
	}

	return &types.GetHollandQuestionsResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &testData,
	}, nil
}

type SubmitHollandTestLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewSubmitHollandTestLogic(ctx context.Context, svcCtx *svc.ServiceContext) *SubmitHollandTestLogic {
	return &SubmitHollandTestLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *SubmitHollandTestLogic) SubmitHollandTest(req *types.SubmitHollandTestReq) (*types.SubmitHollandTestResp, error) {
	// 验证答案数量
	if len(req.Answers) == 0 {
		return &types.SubmitHollandTestResp{
			Code: errors.CodeInvalidParams,
			Msg:  "answers are required",
		}, nil
	}

	// 获取用户ID
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.SubmitHollandTestResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	// 计算各类型得分
	scores := calculateScores(req.Answers)

	// 按得分排序，获取前三个类型
	topTypes := getTopTypes(scores)

	// 生成职业代码
	careerCode := generateCareerCode(topTypes)

	// 加载测试数据以获取职业类型信息
	testData, err := loadHollandTestData()
	if err != nil {
		logx.Errorf("Failed to load holland test data: %v", err)
		return &types.SubmitHollandTestResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to load test data",
		}, nil
	}

	// 获取推荐职业
	suitableJobs := getSuitableJobs(careerCode, testData.CareerTypes)

	// 生成描述
	description := generateDescription(careerCode, topTypes, testData.CareerTypes)

	// 序列化JSON字段
	scoresJSON, _ := json.Marshal(scores)
	suitableJobsJSON, _ := json.Marshal(suitableJobs)

	// 获取学生ID
	student, err := l.svcCtx.StudentModel.FindOneByUserId(l.ctx, userId)
	if err != nil {
		logx.Errorf("FindOneByUserId failed: %v", err)
		return &types.SubmitHollandTestResp{
			Code: errors.CodeInternalError,
			Msg:  "student profile not found",
		}, nil
	}

	// 保存测试结果
	testResult := &model.HollandTestResults{
		StudentId:    student.Id,
		CareerCode:   careerCode,
		Scores:       string(scoresJSON),
		SuitableJobs: string(suitableJobsJSON),
		Description:  sql.NullString{String: description, Valid: true},
		CreatedAt:    time.Now().Unix(),
	}

	result, err := l.svcCtx.HollandTestResultsModel.Insert(l.ctx, testResult)
	if err != nil {
		logx.Errorf("Insert failed: %v", err)
		return &types.SubmitHollandTestResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to save test result",
		}, nil
	}

	testId, err := result.LastInsertId()
	if err != nil {
		logx.Errorf("Get last insert id failed: %v", err)
		return &types.SubmitHollandTestResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to get test id",
		}, nil
	}

	logx.Infof("Saved holland test result for student %d, test_id: %d, career_code: %s", student.Id, testId, careerCode)

	return &types.SubmitHollandTestResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.HollandResult{
			TestId:       testId,
			StudentId:    student.Id,
			CareerCode:   careerCode,
			Scores:       scores,
			TopTypes:     topTypes,
			SuitableJobs: suitableJobs,
			Description:  description,
			CreatedAt:    time.Now().Unix(),
		},
	}, nil
}

type GetHollandResultLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetHollandResultLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetHollandResultLogic {
	return &GetHollandResultLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetHollandResultLogic) GetHollandResult(testId int64) (*types.GetHollandResultResp, error) {
	// 查询测试结果
	testResult, err := l.svcCtx.HollandTestResultsModel.FindOne(l.ctx, testId)
	if err != nil {
		logx.Errorf("FindOne failed: %v", err)
		return &types.GetHollandResultResp{
			Code: errors.CodeInternalError,
			Msg:  "test result not found",
		}, nil
	}

	// 检查权限
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.GetHollandResultResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	student, err := l.svcCtx.StudentModel.FindOne(l.ctx, testResult.StudentId)
	if err != nil || student.UserId != userId {
		return &types.GetHollandResultResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	// 反序列化JSON字段
	var scores map[string]int
	var suitableJobs []string

	json.Unmarshal([]byte(testResult.Scores), &scores)
	json.Unmarshal([]byte(testResult.SuitableJobs), &suitableJobs)

	// 获取职业类型信息
	testData, err := loadHollandTestData()
	if err != nil {
		logx.Errorf("Failed to load holland test data: %v", err)
		return &types.GetHollandResultResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to load test data",
		}, nil
	}

	// 构建TopTypes
	topTypes := buildTopTypes(scores, testData.CareerTypes)

	description := ""
	if testResult.Description.Valid {
		description = testResult.Description.String
	}

	return &types.GetHollandResultResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.HollandResult{
			TestId:       testResult.Id,
			StudentId:    testResult.StudentId,
			CareerCode:   testResult.CareerCode,
			Scores:       scores,
			TopTypes:     topTypes,
			SuitableJobs: suitableJobs,
			Description:  description,
			CreatedAt:    testResult.CreatedAt,
		},
	}, nil
}

type GetHollandHistoryLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetHollandHistoryLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetHollandHistoryLogic {
	return &GetHollandHistoryLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetHollandHistoryLogic) GetHollandHistory(req *types.GetHollandHistoryReq) (*types.GetHollandHistoryResp, error) {
	// 获取用户ID
	userId, ok := l.ctx.Value("userId").(int64)
	if !ok {
		return &types.GetHollandHistoryResp{
			Code: errors.CodeUnauthorized,
			Msg:  "unauthorized",
		}, nil
	}

	// 查询学生信息
	student, err := l.svcCtx.StudentModel.FindOneByUserId(l.ctx, userId)
	if err != nil {
		logx.Errorf("FindOneByUserId failed: %v", err)
		return &types.GetHollandHistoryResp{
			Code: errors.CodeInternalError,
			Msg:  "student profile not found",
		}, nil
	}

	// 分页参数
	page := req.Page
	if page <= 0 {
		page = 1
	}
	pageSize := req.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}

	// 查询历史记录
	testResults, total, err := l.svcCtx.HollandTestResultsModel.FindAllByStudentId(l.ctx, student.Id, page, pageSize)
	if err != nil {
		logx.Errorf("FindAllByStudentId failed: %v", err)
		return &types.GetHollandHistoryResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to get history",
		}, nil
	}

	// 加载测试数据
	testData, err := loadHollandTestData()
	if err != nil {
		logx.Errorf("Failed to load holland test data: %v", err)
		return &types.GetHollandHistoryResp{
			Code: errors.CodeInternalError,
			Msg:  "failed to load test data",
		}, nil
	}

	// 转换为响应格式
	list := make([]types.HollandResult, 0, len(testResults))
	for _, testResult := range testResults {
		var scores map[string]int
		var suitableJobs []string

		json.Unmarshal([]byte(testResult.Scores), &scores)
		json.Unmarshal([]byte(testResult.SuitableJobs), &suitableJobs)

		topTypes := buildTopTypes(scores, testData.CareerTypes)

		description := ""
		if testResult.Description.Valid {
			description = testResult.Description.String
		}

		list = append(list, types.HollandResult{
			TestId:       testResult.Id,
			StudentId:    testResult.StudentId,
			CareerCode:   testResult.CareerCode,
			Scores:       scores,
			TopTypes:     topTypes,
			SuitableJobs: suitableJobs,
			Description:  description,
			CreatedAt:    testResult.CreatedAt,
		})
	}

	return &types.GetHollandHistoryResp{
		Code: errors.CodeSuccess,
		Msg:  "success",
		Data: &types.HollandHistoryData{
			Total: total,
			List:  list,
		},
	}, nil
}

// calculateScores 计算各类型得分
func calculateScores(answers []types.HollandAnswer) map[string]int {
	scores := make(map[string]int)
	for _, answer := range answers {
		if answer.SelectedType != "" {
			scores[answer.SelectedType]++
		}
	}
	return scores
}

// getTopTypes 获取得分最高的前三个类型
func getTopTypes(scores map[string]int) []types.HollandTypeInfo {
	typeScores := make([]struct {
		typeChar string
		score    int
	}, 0, len(scores))

	for t, score := range scores {
		typeScores = append(typeScores, struct {
			typeChar string
			score    int
		}{t, score})
	}

	// 按得分降序排序
	sort.Slice(typeScores, func(i, j int) bool {
		return typeScores[i].score > typeScores[j].score
	})

	// 取前三个
	topTypes := make([]types.HollandTypeInfo, 0, 3)
	for i := 0; i < len(typeScores) && i < 3; i++ {
		topTypes = append(topTypes, types.HollandTypeInfo{
			Type:  typeScores[i].typeChar,
			Score: typeScores[i].score,
		})
	}

	return topTypes
}

// generateCareerCode 生成职业代码
func generateCareerCode(topTypes []types.HollandTypeInfo) string {
	code := ""
	for _, t := range topTypes {
		code += t.Type
	}
	return code
}

// getSuitableJobs 获取推荐职业
func getSuitableJobs(careerCode string, careerTypes map[string]types.HollandCareerType) []string {
	jobs := make(map[string]bool)
	
	// 为前三个类型收集职业
	for _, char := range careerCode {
		if careerType, ok := careerTypes[string(char)]; ok {
			for _, job := range careerType.SuitableJobs {
				jobs[job] = true
			}
		}
	}

	// 转换为切片
	result := make([]string, 0, len(jobs))
	for job := range jobs {
		result = append(result, job)
	}

	return result
}

// generateDescription 生成测试结果描述
func generateDescription(careerCode string, topTypes []types.HollandTypeInfo, careerTypes map[string]types.HollandCareerType) string {
	desc := "您的职业兴趣组合为" + careerCode + "，"
	
	typeNames := make([]string, 0, len(topTypes))
	for _, t := range topTypes {
		if careerType, ok := careerTypes[t.Type]; ok {
			typeNames = append(typeNames, careerType.Name)
		}
	}
	
	desc += "主要特征包括" + joinStrings(typeNames, "、") + "。"
	desc += "您适合从事" + joinStrings(getSuitableJobs(careerCode, careerTypes), "、") + "等职业方向。"
	
	return desc
}

// buildTopTypes 构建TopTypes（包含完整的职业类型信息）
func buildTopTypes(scores map[string]int, careerTypes map[string]types.HollandCareerType) []types.HollandTypeInfo {
	topTypes := getTopTypes(scores)
	
	// 补充职业类型信息
	for i := range topTypes {
		if careerType, ok := careerTypes[topTypes[i].Type]; ok {
			topTypes[i].Name = careerType.Name
			topTypes[i].Description = careerType.Description
			topTypes[i].Color = careerType.Color
		}
	}
	
	return topTypes
}

// loadHollandTestData 从JSON文件加载测试数据
func loadHollandTestData() (types.HollandTestInfo, error) {
	var testData types.HollandTestInfo
	
	// 从internal/pkg/hollande_test_analysis.json文件加载
	data, err := os.ReadFile("internal/pkg/hollande_test_analysis.json")
	if err != nil {
		logx.Errorf("Failed to read holland test data file: %v", err)
		return testData, err
	}
	
	if err := json.Unmarshal(data, &testData); err != nil {
		logx.Errorf("Failed to unmarshal holland test data: %v", err)
		return testData, err
	}
	
	return testData, nil
}

// joinStrings 连接字符串数组
func joinStrings(strs []string, sep string) string {
	if len(strs) == 0 {
		return ""
	}
	result := strs[0]
	for i := 1; i < len(strs); i++ {
		result += sep + strs[i]
	}
	return result
}