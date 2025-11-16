package fsConnector

import (
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"
	"unsafe"

	"github.com/grumpypixel/msfs2020-simconnect-go/simconnect"

	dataTypes "fsConnector/backend/Types"
)

type Msfs2020Connector struct {
	app        FsDataInterface
	simConnect *simconnect.SimConnect

	simVars      []*SimVar
	simVarLookup map[simconnect.DWord]*SimVar
	lastValues   map[simconnect.DWord]float64

	FsData dataTypes.FsData

	done       chan bool
	simReady   chan bool
	subscribed bool
}

type SimVar struct {
	DefineID   simconnect.DWord
	RequestID  simconnect.DWord
	Name, Unit string
}

func NewMsfs2020Connector(app FsDataInterface) (FsConnector, error) {
	connector := &Msfs2020Connector{app: app}
	connector.updateConnection(false)

	// Initialize SimConnect
	additionalSearchPath := ""
	if err := simconnect.Initialize(additionalSearchPath); err != nil {
		log.Printf("MSFS2020: Failed to initialize SimConnect: %v", err)
		return nil, err
	}

	connector.simConnect = simconnect.NewSimConnect()
	if err := connector.simConnect.Open("FSTouchCompanion"); err != nil {
		log.Printf("MSFS2020: Failed to open SimConnect: %v", err)
		return nil, err
	}

	connector.simVars = make([]*SimVar, 0)
	connector.simVarLookup = make(map[simconnect.DWord]*SimVar)
	connector.lastValues = make(map[simconnect.DWord]float64)
	connector.done = make(chan bool, 1)
	connector.simReady = make(chan bool, 1)
	connector.subscribed = false

	// Start event handling first
	go connector.HandleEvents()

	// Wait for the sim to signal it's ready (via RecvIDOpen event)
	select {
	case <-connector.simReady:
		log.Println("MSFS2020: Sim is ready, subscribing to data...")
	case <-time.After(5 * time.Second):
		log.Println("MSFS2020: Timeout waiting for sim ready, proceeding anyway...")
	}

	connector.subscribeToData()

	log.Printf("MSFS2020: Connected to Flight Simulator")

	// Start position updates
	go connector.UpdatePosition()

	return connector, nil
}

func (m *Msfs2020Connector) subscribeToData() {
	if m.subscribed {
		return
	}

	// Define SimVars to subscribe to
	nameUnitPairs := []struct{ name, unit string }{
		{"COM ACTIVE FREQUENCY:1", "MHz"},
		{"COM STANDBY FREQUENCY:1", "MHz"},
		{"COM ACTIVE FREQUENCY:2", "MHz"},
		{"COM STANDBY FREQUENCY:2", "MHz"},
		{"PLANE LATITUDE", "Degrees"},
		{"PLANE LONGITUDE", "Degrees"},
		{"TITLE", ""},
	}

	// Setup data definitions and subscribe to automatic updates
	for _, pair := range nameUnitPairs {
		defineID := simconnect.NewDefineID()
		requestID := simconnect.NewRequestID()

		// Determine data type based on unit
		dataType := simconnect.DWord(simconnect.DataTypeFloat64)
		if pair.name == "TITLE" {
			dataType = simconnect.DWord(simconnect.DataTypeString256)
		}

		// Add the data definition
		m.simConnect.AddToDataDefinition(defineID, pair.name, pair.unit, dataType)

		// Request event-driven updates
		m.simConnect.RequestDataOnSimObject(
			requestID,
			defineID,
			simconnect.ObjectIDUser,
			simconnect.PeriodVisualFrame,
			simconnect.DWordZero,
		)

		simVar := &SimVar{defineID, requestID, pair.name, pair.unit}
		m.simVars = append(m.simVars, simVar)
		m.simVarLookup[defineID] = simVar
	}

	m.subscribed = true
	log.Printf("MSFS2020: Subscribed to %d SimVars", len(m.simVars))
}

func (m *Msfs2020Connector) GetConnectionStatus() bool {
	return m.FsData.Connected
}

func (m *Msfs2020Connector) GetAircraftName() string {
	return strings.TrimSpace(m.FsData.AircraftName)
}

func (m *Msfs2020Connector) SwitchCom1() error {
	return m.triggerEvent("COM_STBY_RADIO_SWAP")
}

func (m *Msfs2020Connector) SwitchCom2() error {
	return m.triggerEvent("COM2_RADIO_SWAP")
}

func (m *Msfs2020Connector) SetCom1Stby(frequency string) error {
	freqFloat, err := strconv.ParseFloat(frequency, 64)
	if err != nil {
		return fmt.Errorf("invalid frequency format: %v", err)
	}
	// COM_STBY_RADIO_SET_HZ expects frequency in Hz
	freqHz := uint32(freqFloat * 1000000)
	return m.triggerEventWithData("COM_STBY_RADIO_SET_HZ", simconnect.DWord(freqHz))
}

func (m *Msfs2020Connector) SetCom2Stby(frequency string) error {
	freqFloat, err := strconv.ParseFloat(frequency, 64)
	if err != nil {
		return fmt.Errorf("invalid frequency format: %v", err)
	}
	// COM2_STBY_RADIO_SET_HZ expects frequency in Hz
	freqHz := uint32(freqFloat * 1000000)
	return m.triggerEventWithData("COM2_STBY_RADIO_SET_HZ", simconnect.DWord(freqHz))
}

// ----------------- MSFS2020 specific methods -----------------

func (m *Msfs2020Connector) HandleEvents() {
	defer func() {
		if m.simConnect != nil {
			m.simConnect.Close()
		}
	}()

	for {
		select {
		case <-m.done:
			log.Printf("MSFS2020: Event handler stopped")
			return
		default:
			// Check for incoming dispatches from SimConnect
			ppData, r1, err := m.simConnect.GetNextDispatch()
			if r1 < 0 {
				if uint32(r1) != simconnect.EFail {
					log.Printf("MSFS2020: GetNextDispatch error: %d %s", r1, err)
					m.updateConnection(false)
					return
				}
				// No data available, yield briefly to avoid busy loop
				time.Sleep(time.Millisecond)
				continue
			}

			recv := *(*simconnect.Recv)(ppData)
			switch recv.ID {
			case simconnect.RecvIDOpen:
				log.Println("MSFS2020: SimConnect opened, signaling ready")
				m.updateConnection(true)
				// Signal that sim is ready for subscriptions
				select {
				case m.simReady <- true:
				default:
				}

			case simconnect.RecvIDQuit:
				log.Println("MSFS2020: Disconnected from Flight Simulator")
				m.updateConnection(false)
				m.done <- true
				return

			case simconnect.RecvIDException:
				recvException := *(*simconnect.RecvException)(ppData)
				exceptionName := m.getExceptionName(recvException.Exception)
				log.Printf("MSFS2020: SimConnect Exception %d (%s) - SendID: %d, Index: %d", 
					recvException.Exception, exceptionName, recvException.SendID, recvException.Index)

			case simconnect.RecvIDSimobjectData:
				data := *(*simconnect.RecvSimObjectData)(ppData)
				m.processSimObjectData(ppData, data.DefineID)

			case simconnect.RecvIDSimObjectDataByType:
				data := *(*simconnect.RecvSimObjectDataByType)(ppData)
				m.processSimObjectData(ppData, data.DefineID)
			}
		}
	}
}

func (m *Msfs2020Connector) processSimObjectData(ppData unsafe.Pointer, defineID simconnect.DWord) {
	if simVar, exists := m.simVarLookup[defineID]; exists {
		var dataOffset uintptr
		if simVar.Unit == "String" {
			// For RecvSimObjectData, skip the header
			dataOffset = unsafe.Sizeof(simconnect.RecvSimObjectData{})
		} else {
			dataOffset = unsafe.Sizeof(simconnect.RecvSimObjectData{})
		}

		dataChanged := false

		if simVar.Name == "TITLE" {
			// Handle string data (aircraft name)
			// Cast to byte array and convert to string
			byteArray := *(*[256]byte)(unsafe.Pointer(uintptr(ppData) + dataOffset))
			// Find null terminator
			len := 0
			for i, b := range byteArray {
				if b == 0 {
					len = i
					break
				}
			}
			str := string(byteArray[:len])
			prevValue := m.FsData.AircraftName
			m.FsData.AircraftName = strings.TrimSpace(str)
			if prevValue != m.FsData.AircraftName && m.FsData.AircraftName != "" {
				log.Printf("MSFS2020: Aircraft changed to '%s'", m.FsData.AircraftName)
				m.app.SetAircraftName(m.FsData.AircraftName)
				dataChanged = true
			}
		} else {
			// Handle numeric data
			val := *(*float64)(unsafe.Pointer(uintptr(ppData) + dataOffset))
			lastVal, ok := m.lastValues[defineID]

			// Update only if value changed or first time
			if !ok || val != lastVal {
				m.lastValues[defineID] = val

				switch simVar.Name {
				case "COM ACTIVE FREQUENCY:1":
					m.FsData.Com1Act = fmt.Sprintf("%.3f", val)
					dataChanged = true
				case "COM STANDBY FREQUENCY:1":
					m.FsData.Com1Stby = fmt.Sprintf("%.3f", val)
					dataChanged = true
				case "COM ACTIVE FREQUENCY:2":
					m.FsData.Com2Act = fmt.Sprintf("%.3f", val)
					dataChanged = true
				case "COM STANDBY FREQUENCY:2":
					m.FsData.Com2Stby = fmt.Sprintf("%.3f", val)
					dataChanged = true
				case "PLANE LATITUDE":
					m.FsData.Position.Lat = val
					// Don't trigger update for position changes - handled by UpdatePosition ticker
				case "PLANE LONGITUDE":
					m.FsData.Position.Lon = val
					// Don't trigger update for position changes - handled by UpdatePosition ticker
				}
			}
		}

		// Only send update if non-position data changed
		if dataChanged {
			m.app.SetFsData(m.FsData)
		}
	}
}

func (m *Msfs2020Connector) UpdatePosition() {
	ticker := time.NewTicker(120 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-m.done:
			return
		case <-ticker.C:
			// Trigger position update by sending the latest cached values
			m.app.SetFsData(m.FsData)
		}
	}
}

func (m *Msfs2020Connector) triggerEvent(eventName string) error {
	eventID := simconnect.NewEventID()
	groupID := simconnect.DWord(0)

	m.simConnect.MapClientEventToSimEvent(eventID, eventName)
	m.simConnect.AddClientEventToNotificationGroup(groupID, eventID, false)
	m.simConnect.SetNotificationGroupPriority(groupID, simconnect.GroupPriorityHighest)

	err := m.simConnect.TransmitClientEvent(
		uint32(simconnect.ObjectIDUser),
		uint32(eventID),
		simconnect.DWordZero,
		groupID,
		simconnect.EventFlagGroupIDIsPriority,
	)
	if err != nil {
		log.Printf("MSFS2020: Failed to trigger event %s: %v", eventName, err)
		return err
	}
	log.Printf("MSFS2020: Triggered event %s", eventName)
	return nil
}

func (m *Msfs2020Connector) triggerEventWithData(eventName string, data simconnect.DWord) error {
	eventID := simconnect.NewEventID()
	groupID := simconnect.DWord(0)

	m.simConnect.MapClientEventToSimEvent(eventID, eventName)
	m.simConnect.AddClientEventToNotificationGroup(groupID, eventID, false)
	m.simConnect.SetNotificationGroupPriority(groupID, simconnect.GroupPriorityHighest)

	err := m.simConnect.TransmitClientEvent(
		uint32(simconnect.ObjectIDUser),
		uint32(eventID),
		data,
		groupID,
		simconnect.EventFlagGroupIDIsPriority,
	)
	if err != nil {
		log.Printf("MSFS2020: Failed to trigger event %s with data %d: %v", eventName, data, err)
		return err
	}
	log.Printf("MSFS2020: Triggered event %s with data %d", eventName, data)
	return nil
}

func (m *Msfs2020Connector) updateConnection(connected bool) {
	m.FsData.Connected = connected
	m.app.SetFsData(m.FsData)
	m.app.SetConnectionStatus(connected)
}

func (m *Msfs2020Connector) getExceptionName(exception simconnect.DWord) string {
	names := map[simconnect.DWord]string{
		0:  "NONE",
		1:  "ERROR",
		2:  "SIZE_MISMATCH",
		3:  "UNRECOGNIZED_ID",
		4:  "UNOPENED",
		5:  "VERSION_MISMATCH",
		6:  "TOO_MANY_GROUPS",
		7:  "NAME_UNRECOGNIZED",
		8:  "TOO_MANY_EVENT_NAMES",
		9:  "EVENT_ID_DUPLICATE",
		10: "TOO_MANY_MAPS",
		11: "TOO_MANY_OBJECTS",
		12: "TOO_MANY_REQUESTS",
		13: "WEATHER_INVALID_PORT",
		14: "WEATHER_INVALID_METAR",
		15: "WEATHER_UNABLE_TO_GET_OBSERVATION",
		16: "WEATHER_UNABLE_TO_CREATE_STATION",
		17: "WEATHER_UNABLE_TO_REMOVE_STATION",
		18: "INVALID_DATA_TYPE",
		19: "INVALID_DATA_SIZE",
		20: "DATA_ERROR",
		21: "INVALID_ARRAY",
		22: "CREATE_OBJECT_FAILED",
	}
	if name, ok := names[exception]; ok {
		return name
	}
	return "UNKNOWN"
}
