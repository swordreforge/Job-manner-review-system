package user

import (
	"fmt"
	"path"
	"strings"
)

func buildAvatarURL(avatarValue string, baseURL string) string {
	avatar := strings.TrimSpace(avatarValue)
	if avatar == "" {
		return ""
	}

	if strings.HasPrefix(avatar, "http://") || strings.HasPrefix(avatar, "https://") {
		return avatar
	}

	normalized := strings.ReplaceAll(avatar, "\\", "/")
	normalized = strings.TrimPrefix(normalized, "./")
	normalized = strings.TrimPrefix(normalized, "/")
	normalized = strings.TrimPrefix(normalized, "img/")

	// Backward compatibility: old data may contain absolute filesystem paths.
	if strings.Contains(normalized, ":/") || strings.HasPrefix(normalized, "../") {
		normalized = path.Base(normalized)
	}

	if strings.TrimSpace(baseURL) == "" {
		return "/img/" + normalized
	}

	return strings.TrimRight(baseURL, "/") + "/" + normalized
}

func withAvatarVersion(rawURL string, version int64) string {
	url := strings.TrimSpace(rawURL)
	if url == "" || version <= 0 {
		return url
	}

	separator := "?"
	if strings.Contains(url, "?") {
		separator = "&"
	}

	return fmt.Sprintf("%s%sv=%d", url, separator, version)
}
