package handler

import (
	"net/http"

	"github.com/zeromicro/go-zero/rest"

	"career-api/internal/svc"
)

const (
	Version = "1.0.0"
)

func RegisterHandlers(server *rest.Server, serverCtx *svc.ServiceContext) {
	RegisterHealthHandler(server)
	RegisterJobHandlers(server, serverCtx)
	RegisterGraphHandlers(server, serverCtx)
	RegisterStudentHandlers(server, serverCtx)
	RegisterMatchHandlers(server, serverCtx)
	RegisterReportHandlers(server, serverCtx)
	RegisterUserHandlers(server, serverCtx)
}

func RegisterHealthHandler(server *rest.Server) {
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodGet,
				Path:    "/health",
				Handler: healthHandler(),
			},
		},
	)
}

func RegisterJobHandlers(server *rest.Server, serverCtx *svc.ServiceContext) {
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodPost,
				Path:    "/api/v1/jobs",
				Handler: createJobHandler(serverCtx),
			},
			{
				Method:  http.MethodPut,
				Path:    "/api/v1/jobs",
				Handler: updateJobHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/api/v1/jobs/:id",
				Handler: getJobHandler(serverCtx),
			},
			{
				Method:  http.MethodDelete,
				Path:    "/api/v1/jobs/:id",
				Handler: deleteJobHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/api/v1/jobs",
				Handler: listJobsHandler(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/api/v1/jobs/generate",
				Handler: generateJobProfileHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/api/v1/jobs/:id/promotion-path",
				Handler: getPromotionPathHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/api/v1/jobs/:id/transfer-paths",
				Handler: getTransferPathsHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/api/v1/jobs/:id/all-paths",
				Handler: getAllPathsHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/api/v1/jobs/:id/related",
				Handler: getRelatedJobsHandler(serverCtx),
			},
		},
	)
}

func RegisterGraphHandlers(server *rest.Server, serverCtx *svc.ServiceContext) {
	// Graph routes are included in job handlers
}

func RegisterStudentHandlers(server *rest.Server, serverCtx *svc.ServiceContext) {
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodPost,
				Path:    "/api/v1/students",
				Handler: createStudentHandler(serverCtx),
			},
			{
				Method:  http.MethodPut,
				Path:    "/api/v1/students",
				Handler: updateStudentHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/api/v1/students/:id",
				Handler: getStudentHandler(serverCtx),
			},
			{
				Method:  http.MethodDelete,
				Path:    "/api/v1/students/:id",
				Handler: deleteStudentHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/api/v1/students",
				Handler: listStudentsHandler(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/api/v1/students/resume",
				Handler: uploadResumeHandler(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/api/v1/students/generate",
				Handler: generateProfileHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/api/v1/students/me",
				Handler: getMyProfileHandler(serverCtx),
			},
		},
	)
}

func RegisterMatchHandlers(server *rest.Server, serverCtx *svc.ServiceContext) {
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodPost,
				Path:    "/api/v1/match",
				Handler: matchStudentJobHandler(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/api/v1/match/jobs",
				Handler: matchStudentJobsHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/api/v1/match/:studentId/:jobId/score",
				Handler: getMatchScoreHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/api/v1/match/:studentId/recommend",
				Handler: getRecommendedJobsHandler(serverCtx),
			},
		},
	)
}

func RegisterReportHandlers(server *rest.Server, serverCtx *svc.ServiceContext) {
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodPost,
				Path:    "/api/v1/reports/generate",
				Handler: generateReportHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/api/v1/reports/:id",
				Handler: getReportHandler(serverCtx),
			},
			{
				Method:  http.MethodPut,
				Path:    "/api/v1/reports",
				Handler: updateReportHandler(serverCtx),
			},
			{
				Method:  http.MethodDelete,
				Path:    "/api/v1/reports/:id",
				Handler: deleteReportHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/api/v1/reports",
				Handler: listReportsHandler(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/api/v1/reports/export",
				Handler: exportReportHandler(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/api/v1/reports/polish",
				Handler: polishReportHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/api/v1/reports/:id/completeness",
				Handler: checkReportCompletenessHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/api/v1/reports/me",
				Handler: getMyReportsHandler(serverCtx),
			},
		},
	)
}

func RegisterUserHandlers(server *rest.Server, serverCtx *svc.ServiceContext) {
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodPost,
				Path:    "/api/v1/user/register",
				Handler: registerHandler(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/api/v1/user/login",
				Handler: loginHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/api/v1/user/info",
				Handler: getUserInfoHandler(serverCtx),
			},
			{
				Method:  http.MethodPut,
				Path:    "/api/v1/user/info",
				Handler: updateUserInfoHandler(serverCtx),
			},
		},
	)
}

func healthHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","version":"` + Version + `"}`))
	}
}
