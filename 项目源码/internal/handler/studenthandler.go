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

func createStudentHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.CreateStudentReq
		if err := httpx.Parse(r, &req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		l := logic.NewCreateStudentLogic(r.Context(), svcCtx)
		resp, err := l.CreateStudent(&req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}

func updateStudentHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.UpdateStudentReq
		if err := httpx.Parse(r, &req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		l := logic.NewUpdateStudentLogic(r.Context(), svcCtx)
		resp, err := l.UpdateStudent(&req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}

func getStudentHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			http.Error(w, "invalid id", http.StatusBadRequest)
			return
		}

		l := logic.NewGetStudentLogic(r.Context(), svcCtx)
		resp, err := l.GetStudent(id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}

func deleteStudentHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			http.Error(w, "invalid id", http.StatusBadRequest)
			return
		}

		l := logic.NewDeleteStudentLogic(r.Context(), svcCtx)
		resp, err := l.DeleteStudent(id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}

func listStudentsHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.StudentListReq
		if err := httpx.Parse(r, &req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		l := logic.NewListStudentsLogic(r.Context(), svcCtx)
		resp, err := l.ListStudents(&req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}

func uploadResumeHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ResumeUploadReq
		if err := httpx.Parse(r, &req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		l := logic.NewUploadResumeLogic(r.Context(), svcCtx)
		resp, err := l.UploadResume(&req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}

func generateProfileHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.GenerateProfileReq
		if err := httpx.Parse(r, &req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		l := logic.NewGenerateProfileLogic(r.Context(), svcCtx)
		resp, err := l.GenerateProfile(&req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}

func getMyProfileHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := logic.NewGetMyProfileLogic(r.Context(), svcCtx)
		resp, err := l.GetMyProfile()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}
