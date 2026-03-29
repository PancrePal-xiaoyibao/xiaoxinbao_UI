package app

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"time"
)

type chatRequest struct {
	Messages []map[string]any `json:"messages"`
	Stream   *bool            `json:"stream,omitempty"`
}

func (s *Server) handleChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}

	if s.config.ChatAPIURL == "" || s.config.ChatAPIKey == "" {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "服务端配置不完整，请联系管理员"})
		return
	}

	var body chatRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "请求格式不正确"})
		return
	}

	if len(body.Messages) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "请求格式不正确"})
		return
	}

	stream := true
	if body.Stream != nil {
		stream = *body.Stream
	}

	requestBody, err := json.Marshal(map[string]any{
		"messages": body.Messages,
		"stream":   stream,
	})
	if err != nil {
		writeError(w, err)
		return
	}

	response, err := fetchWithTimeout(r.Context(), 60*time.Second, func(ctx context.Context) (*http.Response, error) {
		request, requestErr := http.NewRequestWithContext(ctx, http.MethodPost, s.config.ChatAPIURL, bytes.NewReader(requestBody))
		if requestErr != nil {
			return nil, requestErr
		}
		request.Header.Set("Content-Type", "application/json")
		request.Header.Set("Authorization", "Bearer "+s.config.ChatAPIKey)
		return s.httpClient.Do(request)
	})
	if err != nil {
		writeError(w, err)
		return
	}
	defer response.Body.Close()

	if response.StatusCode < 200 || response.StatusCode >= 300 {
		writeError(w, newAppError(
			http.StatusBadGateway,
			"对话服务暂时不可用，请稍后重试",
			"聊天上游错误: "+response.Status+" "+safeReadText(cloneResponse(response), 1024),
		))
		return
	}

	contentType := response.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "text/event-stream"
	}
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.WriteHeader(http.StatusOK)

	if _, copyErr := io.Copy(w, response.Body); copyErr != nil {
		return
	}
}

func cloneResponse(response *http.Response) *http.Response {
	if response == nil || response.Body == nil {
		return response
	}

	body, err := io.ReadAll(response.Body)
	if err != nil {
		return response
	}

	response.Body = io.NopCloser(bytes.NewReader(body))
	cloned := *response
	cloned.Body = io.NopCloser(bytes.NewReader(body))
	return &cloned
}
