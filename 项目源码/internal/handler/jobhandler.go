package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/zeromicro/go-zero/rest/httpx"

	"career-api/internal/logic"
	"career-api/internal/svc"
	"career-api/internal/types"
)

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func createJobHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.CreateJobReq
		if err := httpx.Parse(r, &req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]interface{}{"code": 400, "msg": err.Error()})
			return
		}

		l := logic.NewCreateJobLogic(r.Context(), svcCtx)
		resp, err := l.CreateJob(&req)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"code": 500, "msg": err.Error()})
			return
		}

		writeJSON(w, http.StatusOK, resp)
	}
}

func updateJobHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.UpdateJobReq
		if err := httpx.Parse(r, &req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]interface{}{"code": 400, "msg": err.Error()})
			return
		}

		l := logic.NewUpdateJobLogic(r.Context(), svcCtx)
		resp, err := l.UpdateJob(&req)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"code": 500, "msg": err.Error()})
			return
		}

		writeJSON(w, http.StatusOK, resp)
	}
}

func getJobHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]interface{}{"code": 400, "msg": "invalid id"})
			return
		}

		l := logic.NewGetJobLogic(r.Context(), svcCtx)
		resp, err := l.GetJob(id)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"code": 500, "msg": err.Error()})
			return
		}

		writeJSON(w, http.StatusOK, resp)
	}
}

func deleteJobHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]interface{}{"code": 400, "msg": "invalid id"})
			return
		}

		l := logic.NewDeleteJobLogic(r.Context(), svcCtx)
		resp, err := l.DeleteJob(id)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"code": 500, "msg": err.Error()})
			return
		}

		writeJSON(w, http.StatusOK, resp)
	}
}

func listJobsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.JobListReq
		if err := httpx.Parse(r, &req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]interface{}{"code": 400, "msg": err.Error()})
			return
		}

		l := logic.NewListJobsLogic(r.Context(), svcCtx)
		resp, err := l.ListJobs(&req)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"code": 500, "msg": err.Error()})
			return
		}

		writeJSON(w, http.StatusOK, resp)
	}
}

func generateJobProfileHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.JobGenerateReq
		if err := httpx.Parse(r, &req); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]interface{}{"code": 400, "msg": err.Error()})
			return
		}

		l := logic.NewGenerateJobProfileLogic(r.Context(), svcCtx)
		resp, err := l.GenerateJobProfile(&req)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"code": 500, "msg": err.Error()})
			return
		}

		writeJSON(w, http.StatusOK, resp)
	}
}

func getPromotionPathHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]interface{}{"code": 400, "msg": "invalid id"})
			return
		}

		l := logic.NewGetPromotionPathLogic(r.Context(), svcCtx)
		resp, err := l.GetPromotionPath(&types.JobGraphReq{JobId: id})
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"code": 500, "msg": err.Error()})
			return
		}

		writeJSON(w, http.StatusOK, resp)
	}
}

func getTransferPathsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]interface{}{"code": 400, "msg": "invalid id"})
			return
		}

		l := logic.NewGetTransferPathsLogic(r.Context(), svcCtx)
		resp, err := l.GetTransferPaths(&types.JobGraphReq{JobId: id})
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"code": 500, "msg": err.Error()})
			return
		}

		writeJSON(w, http.StatusOK, resp)
	}
}

func getAllPathsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]interface{}{"code": 400, "msg": "invalid id"})
			return
		}

		l := logic.NewGetAllPathsLogic(r.Context(), svcCtx)
		resp, err := l.GetAllPaths(&types.JobGraphReq{JobId: id})
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"code": 500, "msg": err.Error()})
			return
		}

		writeJSON(w, http.StatusOK, resp)
	}
}

func getRelatedJobsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]interface{}{"code": 400, "msg": "invalid id"})
			return
		}

		jobType := r.URL.Query().Get("type")
		if jobType == "" {
			jobType = "related"
		}

		l := logic.NewGetRelatedJobsLogic(r.Context(), svcCtx)
		resp, err := l.GetRelatedJobs(&types.RelatedJobsReq{JobId: id, Type: jobType})
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"code": 500, "msg": err.Error()})
			return
		}

		writeJSON(w, http.StatusOK, resp)
	}
}
