package main

import (
	"log"

	"xiaoxinbao/backend/internal/app"
)

func main() {
	server := app.NewServer(app.LoadConfig())
	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
