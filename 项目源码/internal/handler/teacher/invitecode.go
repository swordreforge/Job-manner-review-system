package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/rest/httpx"

	"career-api/internal/logic/teacher"
	"career-api/internal/svc"
	"career-api/internal/types"
)

func CreateInviteCodeHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.CreateInviteCodeReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := teacher.NewCreateInviteCodeLogic(r.Context(), svcCtx)
		resp, err := l.CreateInviteCode(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		httpx.OkJsonCtx(r.Context(), w, types.CreateInviteCodeAPIResp{
			Code: 0,
			Msg:  "success",
			Data: resp,
		})
	}
}

func ListInviteCodesHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ListInviteCodesReq
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := teacher.NewListInviteCodesLogic(r.Context(), svcCtx)
		resp, err := l.ListInviteCodes(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		httpx.OkJsonCtx(r.Context(), w, map[string]interface{}{
			"code": 0,
			"msg":  "success",
			"data": resp,
		})
	}
}

func RevokeInviteCodeHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Path is like /api/v1/teachers/invite-codes/1
		// Split by "/" and take the last part
		path := r.URL.Path
		parts := strings.Split(path, "/")

		idStr := ""
		for i := len(parts) - 1; i >= 0; i-- {
			if parts[i] != "" {
				idStr = parts[i]
				break
			}
		}

		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil || id == 0 {
			logx.Errorf("invalid id: path=%s, parts=%v, idStr=%s", path, parts, idStr)
			httpx.ErrorCtx(r.Context(), w, fmt.Errorf("invalid invite code id"))
			return
		}

		l := teacher.NewRevokeInviteCodeLogic(r.Context(), svcCtx)
		err = l.RevokeInviteCode(id)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		httpx.OkJsonCtx(r.Context(), w, map[string]interface{}{"code": 0, "msg": "success"})
	}
}

func DeleteInviteCodeHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		parts := strings.Split(path, "/")

		idStr := parts[len(parts)-1]

		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil || id == 0 {
			logx.Errorf("invalid id: path=%s, parts=%v, idStr=%s", path, parts, idStr)
			httpx.ErrorCtx(r.Context(), w, fmt.Errorf("invalid invite code id"))
			return
		}

		l := teacher.NewDeleteInviteCodeLogic(r.Context(), svcCtx)
		err = l.DeleteInviteCode(id)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		httpx.OkJsonCtx(r.Context(), w, map[string]interface{}{"code": 0, "msg": "success"})
	}
}
