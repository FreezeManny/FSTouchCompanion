package main

import (
	"context"
	"fmt"
	efbConnector "fsConnector/backend/efbConnector"

	fsData "fsConnector/backend/Types"
)

// App struct
type App struct {
	ctx context.Context

	efbConnector efbConnector.EfbConnector // Changed to a pointer
	fsData       fsData.FsData
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	connector, err := efbConnector.NewEfbConnector() // Call the NewEfbConnector function from the efbConnector package
	if err != nil {
		fmt.Println("Error creating EfbConnector:", err)
		return
	}
	a.efbConnector = *connector

	go func() {
		fmt.Println("Starting WebSocket server...")
		a.efbConnector.StartWebSocketServer() // Start the server here
	}()
}

// GetConnectionCount returns the number of active WebSocket connections
func (a *App) GetConnectionCount() int {
	return a.efbConnector.GetConnectionNumber() // Call the GetConnectionNumber function on the instance
}
