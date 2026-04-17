package user

import (
	"encoding/json"
	"errors"
	"net/http"

	"career-api/internal/svc"
	"github.com/zeromicro/go-zero/rest/httpx"
)

var errUnauthorized = errors.New("unauthorized")

func CompleteOnboardingHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId, ok := r.Context().Value("userId").(int64)
		if !ok {
			httpx.ErrorCtx(r.Context(), w, errUnauthorized)
			return
		}

		err := svcCtx.UserModel.UpdateFirstLogin(r.Context(), userId, 0)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"code": 0,
			"msg":  "success",
		})
	}
}
