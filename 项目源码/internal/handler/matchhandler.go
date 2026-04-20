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

func matchStudentJobHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.MatchReq
		if err := httpx.Parse(r, &req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		l := logic.NewMatchStudentJobLogic(r.Context(), svcCtx)
		resp, err := l.MatchStudentJob(&req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}

func matchStudentJobsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.MatchListReq
		if err := httpx.Parse(r, &req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		l := logic.NewMatchStudentJobsLogic(r.Context(), svcCtx)
		resp, err := l.MatchStudentJobs(&req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}

func getMatchScoreHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		studentIdStr := r.PathValue("studentId")
		jobIdStr := r.PathValue("jobId")

		studentId, err := strconv.ParseInt(studentIdStr, 10, 64)
		if err != nil {
			http.Error(w, "invalid studentId", http.StatusBadRequest)
			return
		}

		jobId, err := strconv.ParseInt(jobIdStr, 10, 64)
		if err != nil {
			http.Error(w, "invalid jobId", http.StatusBadRequest)
			return
		}

		l := logic.NewGetMatchScoreLogic(r.Context(), svcCtx)
		resp, err := l.GetMatchScore(studentId, jobId)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}

func getRecommendedJobsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		studentIdStr := r.PathValue("studentId")
		studentId, err := strconv.ParseInt(studentIdStr, 10, 64)
		if err != nil {
			http.Error(w, "invalid studentId", http.StatusBadRequest)
			return
		}

		var req types.MatchListReq
		req.StudentId = studentId

		l := logic.NewGetRecommendedJobsLogic(r.Context(), svcCtx)
		resp, err := l.GetRecommendedJobs(&req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}
