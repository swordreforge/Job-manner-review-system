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
				Path:    "/jobs",
				Handler: createJobHandler(serverCtx),
			},
			{
				Method:  http.MethodPut,
				Path:    "/jobs",
				Handler: updateJobHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/jobs/:id",
				Handler: getJobHandler(serverCtx),
			},
			{
				Method:  http.MethodDelete,
				Path:    "/jobs/:id",
				Handler: deleteJobHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/jobs",
				Handler: listJobsHandler(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/jobs/generate",
				Handler: generateJobProfileHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/jobs/:id/promotion-path",
				Handler: getPromotionPathHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/jobs/:id/transfer-paths",
				Handler: getTransferPathsHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/jobs/:id/all-paths",
				Handler: getAllPathsHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/jobs/:id/related",
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
				Path:    "/students",
				Handler: createStudentHandler(serverCtx),
			},
			{
				Method:  http.MethodPut,
				Path:    "/students",
				Handler: updateStudentHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/students/:id",
				Handler: getStudentHandler(serverCtx),
			},
			{
				Method:  http.MethodDelete,
				Path:    "/students/:id",
				Handler: deleteStudentHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/students",
				Handler: listStudentsHandler(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/students/resume",
				Handler: uploadResumeHandler(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/students/generate",
				Handler: generateProfileHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/students/me",
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
				Path:    "/match",
				Handler: matchStudentJobHandler(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/match/jobs",
				Handler: matchStudentJobsHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/match/:studentId/:jobId/score",
				Handler: getMatchScoreHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/match/:studentId/recommend",
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
				Path:    "/reports/generate",
				Handler: generateReportHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/reports/:id",
				Handler: getReportHandler(serverCtx),
			},
			{
				Method:  http.MethodPut,
				Path:    "/reports",
				Handler: updateReportHandler(serverCtx),
			},
			{
				Method:  http.MethodDelete,
				Path:    "/reports/:id",
				Handler: deleteReportHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/reports",
				Handler: listReportsHandler(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/reports/export",
				Handler: exportReportHandler(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/reports/polish",
				Handler: polishReportHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/reports/:id/completeness",
				Handler: checkReportCompletenessHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/reports/me",
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
				Path:    "/user/register",
				Handler: registerHandler(serverCtx),
			},
			{
				Method:  http.MethodPost,
				Path:    "/user/login",
				Handler: loginHandler(serverCtx),
			},
			{
				Method:  http.MethodGet,
				Path:    "/user/info",
				Handler: getUserInfoHandler(serverCtx),
			},
			{
				Method:  http.MethodPut,
				Path:    "/user/info",
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
