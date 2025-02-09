package newEfbConnector

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"sync/atomic"

	"github.com/gorilla/websocket"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type EfbConnector struct {
	ctx              context.Context // Add a context to emit events
	ConnectionNumber int32           // Use int32 for atomic operations
}

// Allows the app to pass Wails' context to the connector
func (e *EfbConnector) SetContext(ctx context.Context) {
	e.ctx = ctx
}

func NewEfbConnector() (*EfbConnector, error) {
	e := &EfbConnector{}
	e.ConnectionNumber = 0
	return e, nil
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

func (e *EfbConnector) GetConnectionNumber() int {
	return int(atomic.LoadInt32(&e.ConnectionNumber))
}

func (e *EfbConnector) StartWebSocketServer() {
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		ws, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("Upgrade error:", err)
			return
		}
		defer ws.Close()

		atomic.AddInt32(&e.ConnectionNumber, 1)
		// Emit new connection count
		fmt.Println("Connection Number: ", e.ConnectionNumber)
		runtime.EventsEmit(e.ctx, "connectionCountChanged", e.GetConnectionNumber())

		defer e.HandleWebSocketDisconnect()

		for {
			msgType, msg, err := ws.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("Unexpected close error: %v", err)
				} else {
					log.Printf("Read error: %v", err)
				}
				break
			}

			if err = ws.WriteMessage(msgType, msg); err != nil {
				log.Println("Write error:", err)
				break
			}
		}
	})

	go func() {
		log.Println("WebSocket server listening on :8080/ws")
		if err := http.ListenAndServe(":8080", nil); err != nil {
			log.Println("ListenAndServe error:", err)
		}
	}()
}

func (e *EfbConnector) HandleWebSocketDisconnect() {
	atomic.AddInt32(&e.ConnectionNumber, -1)
	fmt.Println("Connection Number: ", e.ConnectionNumber)
	// Emit updated count on disconnect
	runtime.EventsEmit(e.ctx, "connectionCountChanged", e.GetConnectionNumber())
}

func (e *EfbConnector) StopWebSocketServer() {
	// Do something
}
