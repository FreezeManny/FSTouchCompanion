package fsConnector

import (
	_ "embed"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

//go:embed xplaneData.json
var xplaneDataJSON []byte

type Xp12Connector struct {
	app              FsDataInterface
	connectionStatus bool
	wsConn           *websocket.Conn

	reqIdCounter int

	xplaneData []XPlaneData

	selectedAircraftData XPlaneData

	AircraftName string

	IdData IdData
}

type IdData struct {
	Lon string
	Lat string

	AircraftName string

	Com1act  string
	Com1stby string
	Com2act  string
	Com2stby string

	Com1Switch string
	Com2Switch string
}

type XPlaneData struct {
	Name []string `json:"name"`
	Data struct {
		Com1 struct {
			DataRef struct {
				Standby string `json:"standby"`
				Active  string `json:"active"`
			} `json:"dataRef"`
			Command struct {
				Switch string `json:"switch"`
			} `json:"command"`
		} `json:"com1"`
		Com2 struct {
			DataRef struct {
				Standby string `json:"standby"`
				Active  string `json:"active"`
			} `json:"dataRef"`
			Command struct {
				Switch string `json:"switch"`
			} `json:"command"`
		} `json:"com2"`
	} `json:"data"`
}

func NewXPlane12Connector(app FsDataInterface) (FsConnector, error) {
	connector := &Xp12Connector{app: app}
	connector.app.SetConnection(false)

	// Parse embedded X-Plane data
	var xplaneData []XPlaneData
	err := json.Unmarshal(xplaneDataJSON, &xplaneData)
	if err != nil {
		log.Printf("X-Plane: Failed to parse X-Plane data: %v", err)
		return nil, err
	}

	lon, err := connector.getDatarefID("sim/flightmodel/position/longitude")
	if err != nil {
		log.Printf("X-Plane: Error fetching longitude dataref ID: %v", err)
		return nil, err
	}

	lat, err := connector.getDatarefID("sim/flightmodel/position/latitude")
	if err != nil {
		log.Printf("X-Plane: Error fetching latitude dataref ID: %v", err)
		return nil, err
	}

	connector.IdData.Lon = lon
	connector.IdData.Lat = lat

	connector.xplaneData = xplaneData

	connector.IdData.AircraftName, _ = connector.getDatarefID("sim/aircraft/view/acf_ui_name")
	val, err := connector.getDatarefValue(connector.IdData.AircraftName)
	if err == nil {
		if sVal, ok := val.(string); ok {
			connector.AircraftName = sVal
		}
	}
	connector.changeAircraft()

	// WebSocket connection setup
	var dialer websocket.Dialer
	wsURL := "ws://localhost:8086/api/v2" // Replace with your WebSocket server URL
	conn, _, err := dialer.Dial(wsURL, nil)
	if err != nil {
		log.Printf("X-Plane: Failed to connect to WebSocket server: %v", err)
		return nil, err
	}
	connector.wsConn = conn
	connector.app.SetConnection(true)
	log.Printf("X-Plane: Connected to WebSocket server at %s", wsURL)

	connector.SubscribeAllDatarefs()

	connector.SetInitialData()

	// Start listening for messages
	go connector.listenForMessages()

	// Start updating Lon and Lat every 10 seconds
	go connector.UpdatePosition()

	return connector, nil
}

func (x *Xp12Connector) GetConnectionStatus() bool {
	if x == nil {
		log.Printf("X-Plane: Xp12Connector instance is nil")
		return false
	}
	return x.connectionStatus
}

func (x *Xp12Connector) GetAircraftName() string {
	// Trim leading and trailing whitespace
	aircraftName := strings.TrimSpace(x.AircraftName)

	// Remove non-printable characters
	cleanedAircraftName := ""
	for _, r := range aircraftName {
		if r >= 32 && r <= 126 {
			cleanedAircraftName += string(r)
		}
	}
	return cleanedAircraftName
}

func (x *Xp12Connector) SwitchCom1() error {
	// Implement the logic for SwitchCom1
	fmt.Println("X-Plane: SwitchCom1")
	return x.triggerCommand(x.IdData.Com1Switch)
}

func (x *Xp12Connector) SwitchCom2() error {
	// Implement the logic for SwitchCom2
	fmt.Println("X-Plane: SwitchCom2")
	return x.triggerCommand(x.IdData.Com2Switch)
}

func (x *Xp12Connector) SetCom1Stby(frequency string) error {
	fmt.Println("X-Plane: Setting COM1 standby to", frequency)
	return x.setDataref(x.IdData.Com1stby, frequency)
}

func (x *Xp12Connector) SetCom2Stby(frequency string) error {
	fmt.Println("X-Plane: Setting COM2 standby to", frequency)
	return x.setDataref(x.IdData.Com2stby, frequency)
}

// ----------------- X-Plane 12 specific methods -----------------

func (x *Xp12Connector) changeAircraft() error {
	// Implement the logic for changing the aircraft
	fmt.Println("X-Plane: Change aircraft")

	x.selectedAircraftData = x.LoadAircraftData(x.AircraftName)

	fmt.Println("X-Plane: Selected aircraft data:", x.selectedAircraftData)

	// Get IDs for all datarefs
	x.IdData.Com1act, _ = x.getDatarefID(x.selectedAircraftData.Data.Com1.DataRef.Active)
	x.IdData.Com1stby, _ = x.getDatarefID(x.selectedAircraftData.Data.Com1.DataRef.Standby)
	x.IdData.Com2act, _ = x.getDatarefID(x.selectedAircraftData.Data.Com2.DataRef.Active)
	x.IdData.Com2stby, _ = x.getDatarefID(x.selectedAircraftData.Data.Com2.DataRef.Standby)

	x.IdData.Com1Switch, _ = x.getDatarefID(x.selectedAircraftData.Data.Com1.Command.Switch)
	x.IdData.Com2Switch, _ = x.getDatarefID(x.selectedAircraftData.Data.Com2.Command.Switch)

	return nil
}

func (x *Xp12Connector) LoadAircraftData(aircraftName string) XPlaneData {
	var defaultAircraft *XPlaneData
	var selectedAircraft *XPlaneData

	// Locate both default and requested aircraft
	for i := range x.xplaneData {
		for _, n := range x.xplaneData[i].Name {
			if strings.Contains(n, "default") && defaultAircraft == nil {
				defaultAircraft = &x.xplaneData[i]
			}
			if strings.Contains(n, aircraftName) && selectedAircraft == nil {
				selectedAircraft = &x.xplaneData[i]
			}
		}
	}

	// Fallback to default if not found
	if selectedAircraft == nil && defaultAircraft != nil {
		selectedAircraft = defaultAircraft
	}

	// If we still have nothing, just return an empty struct
	if selectedAircraft == nil {
		return XPlaneData{}
	}

	// Inline merge logic
	finalAircraft := *defaultAircraft
	finalAircraft.Name = selectedAircraft.Name
	if selectedAircraft.Data.Com1.DataRef.Active != "" {
		finalAircraft.Data.Com1.DataRef.Active = selectedAircraft.Data.Com1.DataRef.Active
	}
	if selectedAircraft.Data.Com1.DataRef.Standby != "" {
		finalAircraft.Data.Com1.DataRef.Standby = selectedAircraft.Data.Com1.DataRef.Standby
	}
	if selectedAircraft.Data.Com1.Command.Switch != "" {
		finalAircraft.Data.Com1.Command.Switch = selectedAircraft.Data.Com1.Command.Switch
	}
	if selectedAircraft.Data.Com2.DataRef.Active != "" {
		finalAircraft.Data.Com2.DataRef.Active = selectedAircraft.Data.Com2.DataRef.Active
	}
	if selectedAircraft.Data.Com2.DataRef.Standby != "" {
		finalAircraft.Data.Com2.DataRef.Standby = selectedAircraft.Data.Com2.DataRef.Standby
	}
	if selectedAircraft.Data.Com2.Command.Switch != "" {
		finalAircraft.Data.Com2.Command.Switch = selectedAircraft.Data.Com2.Command.Switch
	}

	return finalAircraft
}

func (x *Xp12Connector) listenForMessages() {
	defer x.wsConn.Close()
	for {
		_, message, err := x.wsConn.ReadMessage()
		if err != nil {
			log.Printf("X-Plane: WebSocket read error: %v", err)
			x.app.SetConnection(false)
			return
		}
		log.Printf("X-Plane: Received message: %s", message)
		x.ProcessXPlaneRecieve(string(message))
	}
}

func (x *Xp12Connector) getDatarefID(datarefName string) (string, error) {
	httpAddress := "http://localhost:8086/api/v2" // Replace with your actual HTTP server address
	url := fmt.Sprintf("%s/datarefs?filter[name]=%s", httpAddress, datarefName)
	fmt.Println("Fetching dataref ID:", url)

	resp, err := http.Get(url)
	if err != nil {
		log.Printf("X-Plane: Failed to fetch dataref ID: %v", err)
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to fetch dataref ID, status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("X-Plane: Failed to read response body: %v", err)
		return "", err
	}

	//fmt.Println("Response body:", string(body))

	var result struct {
		Data []struct {
			ID int64 `json:"id"` // Changed from string to int64
		} `json:"data"`
	}
	err = json.Unmarshal(body, &result)
	if err != nil {
		log.Printf("X-Plane: Failed to parse JSON response: %v", err)
		return "", err
	}

	if len(result.Data) > 0 {
		return fmt.Sprintf("%d", result.Data[0].ID), nil // Convert int64 to string
	}

	return "", fmt.Errorf("dataref %s not found", datarefName)
}

func (x *Xp12Connector) getDatarefValue(id string) (interface{}, error) {
	httpAddress := "http://localhost:8086/api/v2"
	url := fmt.Sprintf("%s/datarefs/%s/value", httpAddress, id)
	fmt.Println("Fetching dataref value:", url)

	resp, err := http.Get(url)
	if err != nil {
		log.Printf("X-Plane: Failed to fetch dataref value: %v", err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch dataref value, status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("X-Plane: Failed to read response body: %v", err)
		return nil, err
	}

	//fmt.Println("Response body:", string(body))

	var raw map[string]interface{}
	err = json.Unmarshal(body, &raw)
	if err != nil {
		log.Printf("X-Plane: Failed to parse JSON response: %v", err)
		return nil, err
	}
	data, ok := raw["data"]
	if !ok {
		return nil, fmt.Errorf("no 'data' field in response")
	}

	switch v := data.(type) {
	case float64:
		if v == float64(int64(v)) {
			return int64(v), nil
		}
		return v, nil
	case string:
		decoded, decErr := base64.StdEncoding.DecodeString(v)
		if decErr == nil {
			return string(decoded), nil
		}
		return v, nil
	default:
		return v, nil
	}
}

// SubscribeAllDatarefs sends a WebSocket message to subscribe to all recognized datarefs.
func (x *Xp12Connector) SubscribeAllDatarefs() error {
	if x.wsConn == nil {
		return fmt.Errorf("WebSocket connection not initialized")
	}

	// Gather all dataref IDs from x.IdData
	ids := []string{
		x.IdData.AircraftName,
		x.IdData.Com1act,
		x.IdData.Com1stby,
		x.IdData.Com2act,
		x.IdData.Com2stby,
	}

	datarefs := []map[string]interface{}{}
	for _, idStr := range ids {
		if idStr == "" {
			continue
		}
		parsedID, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			log.Printf("Failed to parse ID %s as integer: %v", idStr, err)
			continue
		}
		datarefs = append(datarefs, map[string]interface{}{
			"id": parsedID,
		})
	}

	// Build subscription message
	x.reqIdCounter++
	msg := map[string]interface{}{
		"req_id": x.reqIdCounter, // or any unique ID
		"type":   "dataref_subscribe_values",
		"params": map[string]interface{}{
			"datarefs": datarefs,
		},
	}

	// Send subscription message over WebSocket
	return x.wsConn.WriteJSON(msg)
}

func (x *Xp12Connector) SetInitialData() {
	val, err := x.getDatarefValue(x.IdData.Com1act)
	if err != nil {
		log.Printf("X-Plane: Failed to get COM1 active dataref value: %v", err)
		return
	}
	x.app.SetCom1ActData(fmt.Sprintf("%v", val))

	val, err = x.getDatarefValue(x.IdData.Com1stby)
	if err != nil {
		log.Printf("X-Plane: Failed to get COM1 standby dataref value: %v", err)
		return
	}
	x.app.SetCom1StbData(fmt.Sprintf("%v", val))
	val, err = x.getDatarefValue(x.IdData.Com2act)
	if err != nil {
		log.Printf("X-Plane: Failed to get COM2 active dataref value: %v", err)
		return
	}
	x.app.SetCom2ActData(fmt.Sprintf("%v", val))
	val, err = x.getDatarefValue(x.IdData.Com2stby)
	if err != nil {
		log.Printf("X-Plane: Failed to get COM2 standby dataref value: %v", err)
		return
	}
	x.app.SetCom2StbData(fmt.Sprintf("%v", val))
}

func (x *Xp12Connector) ProcessXPlaneRecieve(msg string) error {
	var message struct {
		Data map[string]interface{} `json:"data"`
		Type string                 `json:"type"`
	}

	err := json.Unmarshal([]byte(msg), &message)
	if err != nil {
		log.Printf("X-Plane: Failed to parse message: %v", err)
		return err
	}

	idMap := map[string]string{
		x.IdData.Com1act:  "Com1 Active",
		x.IdData.Com1stby: "Com1 Standby",
		x.IdData.Com2act:  "Com2 Active",
		x.IdData.Com2stby: "Com2 Standby",
	}

	for id, value := range message.Data {
		name, exists := idMap[id]
		if !exists {
			name = "Unknown"
		} else {
			strValue := fmt.Sprintf("%v", value)
			switch name {
			case "Com1 Active":
				x.app.SetCom1ActData(strValue)
			case "Com1 Standby":
				x.app.SetCom1StbData(strValue)
			case "Com2 Active":
				x.app.SetCom2ActData(strValue)
			case "Com2 Standby":
				x.app.SetCom2StbData(strValue)
			}
		}
		fmt.Printf("Type: %s, ID: %s (%s), Value: %v\n", message.Type, id, name, value)
	}

	return nil
}

func (x *Xp12Connector) UpdatePosition() {
	for {

		lon, err := x.getDatarefValue(x.IdData.Lon)
		if err != nil {
			log.Printf("X-Plane: Failed to get longitude dataref value: %v", err)
			continue
		}
		lat, err := x.getDatarefValue(x.IdData.Lat)
		if err != nil {
			log.Printf("X-Plane: Failed to get latitude dataref value: %v", err)
			continue
		}

		log.Printf("X-Plane: Updated Lon: %v, Lat: %v", lon, lat)
		x.app.SetPosition(lon.(float64), lat.(float64))

		time.Sleep(120 * time.Second)
	}
}

func (x *Xp12Connector) setDataref(datarefId string, value string) error {
	if x.wsConn == nil {
		return fmt.Errorf("WebSocket connection not initialized")
	}

	parsedID, err := strconv.ParseInt(datarefId, 10, 64)
	if err != nil {
		log.Printf("Failed to parse ID %s as integer: %v", datarefId, err)
		return err
	}

	// Build message to set dataref value
	x.reqIdCounter++
	msg := map[string]interface{}{
		"req_id": x.reqIdCounter, // or any unique ID
		"type":   "dataref_set_value",
		"params": map[string]interface{}{
			"id":    parsedID,
			"value": value,
		},
	}

	// Send message over WebSocket
	return x.wsConn.WriteJSON(msg)
}

func (x *Xp12Connector) triggerCommand(commandId string) error {

	if x.wsConn == nil {
		return fmt.Errorf("WebSocket connection not initialized")
	}

	parsedID, err := strconv.ParseInt(commandId, 10, 64)
	if err != nil {
		log.Printf("Failed to parse ID %s as integer: %v", commandId, err)
		return err
	}

	// Build message to set dataref value
	x.reqIdCounter++
	msg := map[string]interface{}{
		"req_id": x.reqIdCounter, // or any unique ID
		"type":   "dataref_set_value",
		"params": map[string]interface{}{
			"id":        parsedID,
			"is_active": true,
			"duration":  0,
		},
	}

	// Send message over WebSocket
	return x.wsConn.WriteJSON(msg)
}
