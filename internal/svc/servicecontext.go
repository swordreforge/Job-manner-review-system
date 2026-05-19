package svc

import (
	"time"

	"github.com/zeromicro/go-zero/core/stores/redis"
	"github.com/zeromicro/go-zero/core/stores/sqlx"

	ai "career-api/common/pkg"
	"career-api/internal/config"
	"career-api/internal/model"
)

type ServiceContext struct {
	Config                  *config.Config
	Redis                   *redis.Redis
	DB                      sqlx.SqlConn
	AIProvider              ai.AIProvider
	AITimeout               time.Duration
	UserModel               model.UsersModel
	JobModel                model.JobsModel
	StudentModel            model.StudentsModel
	ReportModel             model.CareerReportsModel
	MatchModel              model.MatchRecordsModel
	PromotionPathModel      model.JobPromotionPathsModel
	ResumeParseHistoryModel model.ResumeParseHistoryModel
	HollandTestResultsModel model.HollandTestResultsModel
	InterviewSessionsModel  model.InterviewSessionsModel
	InterviewMessagesModel  model.InterviewMessagesModel
	InterviewReportsModel   model.InterviewReportsModel
}

func NewServiceContext(c *config.Config) *ServiceContext {
	mysqlConn := sqlx.NewMysql(c.Mysql.DataSource)

	redisClient := redis.New(c.Redis.Host)

	aiProvider := ai.NewOpenAIProvider(
		c.AI.ApiKey,
		c.AI.Model,
		c.AI.BaseURL,
		time.Duration(c.AI.Timeout)*time.Second,
	)

	return &ServiceContext{
		Config:                  c,
		Redis:                   redisClient,
		DB:                      mysqlConn,
		AIProvider:              aiProvider,
		AITimeout:               time.Duration(c.AI.Timeout) * time.Second,
		UserModel:               model.NewUsersModel(mysqlConn),
		JobModel:                model.NewJobsModel(mysqlConn),
		StudentModel:            model.NewStudentsModel(mysqlConn),
		ReportModel:             model.NewCareerReportsModel(mysqlConn),
		MatchModel:              model.NewMatchRecordsModel(mysqlConn),
		PromotionPathModel:      model.NewJobPromotionPathsModel(mysqlConn),
		ResumeParseHistoryModel: model.NewResumeParseHistoryModel(mysqlConn),
		HollandTestResultsModel: model.NewHollandTestResultsModel(mysqlConn),
		InterviewSessionsModel:  model.NewInterviewSessionsModel(mysqlConn),
		InterviewMessagesModel:  model.NewInterviewMessagesModel(mysqlConn),
		InterviewReportsModel:   model.NewInterviewReportsModel(mysqlConn),
	}
}
