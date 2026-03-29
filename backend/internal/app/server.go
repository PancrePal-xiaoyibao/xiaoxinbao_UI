package app

import (
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

type Server struct {
	config     Config
	httpClient *http.Client
	upgrader   websocket.Upgrader
}

func NewServer(config Config) *Server {
	return &Server{
		config: config,
		httpClient: &http.Client{
			Timeout: 0,
		},
		upgrader: websocket.Upgrader{
			EnableCompression: false,
			CheckOrigin: func(r *http.Request) bool {
				return isOriginAllowed(r.Header.Get("Origin"), config.CORSAllowedOrigins)
			},
		},
	}
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", s.handleHealthz)
	mux.HandleFunc("/api/chat", s.withCORS(s.handleChat))
	mux.HandleFunc("/api/tts", s.withCORS(s.handleTTS))
	mux.HandleFunc("/api/stt", s.withCORS(s.handleSTT))
	mux.HandleFunc("/api/stt/ws", s.handleSTTWebSocket)
	return mux
}

func (s *Server) ListenAndServe() error {
	server := &http.Server{
		Addr:              ":" + s.config.Port,
		Handler:           s.Handler(),
		ReadHeaderTimeout: 10 * time.Second,
	}

	log.Printf("Go backend listening on :%s\n", s.config.Port)
	return server.ListenAndServe()
}

func (s *Server) withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && isOriginAllowed(origin, s.config.CORSAllowedOrigins) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Credentials", "false")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next(w, r)
	}
}

func (s *Server) handleHealthz(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"stt":     strings.ToLower(s.config.STTProvider),
		"tts":     strings.ToLower(s.config.TTSProvider),
		"backend": "go",
	})
}
