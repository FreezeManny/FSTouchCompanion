package newEfbConnector

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"reflect"
	"sync"
	"sync/atomic"

	"github.com/gorilla/websocket"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	dataTypes "fsConnector/backend/Types"
)

type ComInterface interface {
	SwitchCom1()
	SwitchCom2()
	SetCom1Stby(frequency string)
	SetCom2Stby(frequency string)
}

type EfbConnector struct {
	ctx              context.Context // Add a context to emit events
	ConnectionNumber int32           // Use int32 for atomic operations
	currData         dataTypes.FsData
	wsConns          []*websocket.Conn // Store multiple WebSocket connections
	comInt           ComInterface
	mu               sync.Mutex // Mutex to protect wsConns slice
}

// Allows the app to pass Wails' context to the connector
func (e *EfbConnector) SetContext(ctx context.Context) {
	e.ctx = ctx
}

func (e *EfbConnector) SetComInterface(ci ComInterface) {
	e.comInt = ci
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

func (e *EfbConnector) handleWebSocketMessage(msg []byte) {
	// Process the WebSocket message
	/*
		{
		"com1Switch": true,
		"com2Switch": true,
		"com1Stby": "123.450",
		"com2Stby": "123.450",
		}
	*/
	fmt.Println("Received message of type: ", string(msg))

	// Parse JSON
	var data map[string]interface{}
	if err := json.Unmarshal(msg, &data); err != nil {
		log.Println("Failed to parse JSON:", err)
		return
	}

	if val, ok := data["com1Switch"].(bool); ok && val {
		e.comInt.SwitchCom1()
	}

	if val, ok := data["com2Switch"].(bool); ok && val {
		e.comInt.SwitchCom2()
	}

	if val, ok := data["com1Stby"].(string); ok && val != "" {
		e.comInt.SetCom1Stby(val)
	}

	if val, ok := data["com2Stby"].(string); ok && val != "" {
		e.comInt.SetCom2Stby(val)
	}
}

func (e *EfbConnector) StartWebSocketServer() {
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		ws, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("Upgrade error:", err)
			return
		}
		defer ws.Close()

		e.mu.Lock()
		e.wsConns = append(e.wsConns, ws) // Add the WebSocket connection to the slice
		e.mu.Unlock()

		atomic.AddInt32(&e.ConnectionNumber, 1)
		// Emit new connection count
		fmt.Println("Connection Number: ", e.ConnectionNumber)
		runtime.EventsEmit(e.ctx, "connectionCountChanged", e.GetConnectionNumber())

		// Send the current fsData to the new client
		fsDataJSON, err := json.Marshal(e.currData)
		if err != nil {
			log.Println("Error marshalling fsData to JSON:", err)
		} else {
			if err := e.sendWebSocketMessage(websocket.TextMessage, fsDataJSON); err != nil {
				log.Println("Error sending WebSocket message:", err)
			}
		}

		defer e.handleWebSocketDisconnect(ws)

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

			// Call the new handleWebSocketMessage function
			if msgType == websocket.TextMessage {
				log.Println("Received non-text message")
				e.handleWebSocketMessage(msg)
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

func (e *EfbConnector) handleWebSocketDisconnect(ws *websocket.Conn) {
	atomic.AddInt32(&e.ConnectionNumber, -1)
	fmt.Println("Connection Number: ", e.ConnectionNumber)
	// Emit updated count on disconnect
	runtime.EventsEmit(e.ctx, "connectionCountChanged", e.GetConnectionNumber())

	e.mu.Lock()
	defer e.mu.Unlock()
	for i, conn := range e.wsConns {
		if conn == ws {
			e.wsConns = append(e.wsConns[:i], e.wsConns[i+1:]...)
			break
		}
	}
}

func (e *EfbConnector) sendWebSocketMessage(messageType int, data []byte) error {
	e.mu.Lock()
	defer e.mu.Unlock()
	for _, ws := range e.wsConns {
		if ws != nil {
			if err := ws.WriteMessage(messageType, data); err != nil {
				log.Println("Error sending WebSocket message:", err)
			}
		}
	}
	return nil
}

func (e *EfbConnector) UpdateFrontendData(data dataTypes.FsData) {
	// Use reflection to compare fields
	oldValue := reflect.ValueOf(e.currData)
	newValue := reflect.ValueOf(data)

	// Ensure both are structs
	if oldValue.Kind() == reflect.Struct && newValue.Kind() == reflect.Struct {
		changes := map[string]interface{}{}
		for i := 0; i < oldValue.NumField(); i++ {
			oldField := oldValue.Field(i)
			newField := newValue.Field(i)
			if !reflect.DeepEqual(oldField.Interface(), newField.Interface()) {
				fieldName := oldValue.Type().Field(i).Name
				changes[fieldName] = newField.Interface()
			}
		}

		if len(changes) > 0 {
			changesJSON, err := json.Marshal(changes)
			if err != nil {
				fmt.Println("Error marshalling changes to JSON:", err)
				return
			}
			fmt.Println("Updating frontend data with changes:", string(changesJSON))

			// Send changes via WebSocket
			if err := e.sendWebSocketMessage(websocket.TextMessage, changesJSON); err != nil {
				fmt.Println("Error sending WebSocket message:", err)
			}
		} else {
			fmt.Println("No changes in frontend data")
		}

		fmt.Println(e.currData, data)
		// Update the current data with the new data
		e.currData = data
	} else {
		fmt.Println("No changes in frontend data")
	}
}

func (e *EfbConnector) StopWebSocketServer() {
	// Do something
}
