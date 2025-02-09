package newEfbConnector

import (
	"log"
	"net/http"
	"sync/atomic"

	"github.com/gorilla/websocket"
)

type EfbConnector struct {
	ConnectionNumber int32 // Use int32 for atomic operations
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
		defer atomic.AddInt32(&e.ConnectionNumber, -1)

		for {
			msgType, msg, err := ws.ReadMessage()
			if err != nil {
				log.Println("Read error:", err)
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

func (e *EfbConnector) StopWebSocketServer() {
	// Do something
}
