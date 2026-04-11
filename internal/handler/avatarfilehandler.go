package handler

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"career-api/internal/svc"
)

func AvatarFileHandler(serverCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fileName := strings.TrimPrefix(r.URL.Path, "/img/")
		fileName = filepath.Base(fileName)
		if fileName == "" || fileName == "." {
			http.NotFound(w, r)
			return
		}

		savePath := serverCtx.Config.Avatar.SavePath
		if savePath == "" {
			savePath = "./img"
		}

		fullPath := filepath.Join(savePath, fileName)
		if _, err := os.Stat(fullPath); err != nil {
			http.NotFound(w, r)
			return
		}

		w.Header().Set("Cache-Control", "public, max-age=86400")
		http.ServeFile(w, r, fullPath)
	}
}
