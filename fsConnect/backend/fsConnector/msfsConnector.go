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

type MsfsConnector  struct {
	app        FsDataInterface
	simConnect *simconnect.SimConnect

	simVars      []*SimVar
	simVarLookup map[simconnect.DWord]*SimVar
	lastValues   map[simconnect.DWord]float64

	FsData dataTypes.FsData

	done       chan bool
	simReady   chan bool
	subscribed bool

	// Cache for event IDs to avoid duplicate mappings
	eventCache map[string]simconnect.DWord
	groupID    simconnect.DWord

	// Cached position values (not sent with every update)
	currentLat        float64
	currentLon        float64
	positionInitialized bool
}

type SimVar struct {
	DefineID   simconnect.DWord
	RequestID  simconnect.DWord
	Name, Unit string
}

func NewMsfsConnector (app FsDataInterface) (FsConnector, error) {
	connector := &MsfsConnector {app: app}
	connector.updateConnection(false)

	// Initialize SimConnect
	additionalSearchPath := ""
	if err := simconnect.Initialize(additionalSearchPath); err != nil {
		log.Printf("MSFS: Failed to initialize SimConnect: %v", err)
		return nil, err
	}

	connector.simConnect = simconnect.NewSimConnect()
	if err := connector.simConnect.Open("FSTouchCompanion"); err != nil {
		log.Printf("MSFS: Failed to open SimConnect: %v", err)
		return nil, err
	}

	connector.simVars = make([]*SimVar, 0)
	connector.simVarLookup = make(map[simconnect.DWord]*SimVar)
	connector.lastValues = make(map[simconnect.DWord]float64)
	connector.done = make(chan bool, 1)
	connector.simReady = make(chan bool, 1)
	connector.subscribed = false
	connector.eventCache = make(map[string]simconnect.DWord)
	connector.groupID = simconnect.DWord(0)

	// Start event handling first
	go connector.HandleEvents()

	// Wait for the sim to signal it's ready (via RecvIDOpen event)
	select {
	case <-connector.simReady:
		log.Println("MSFS: Sim is ready, subscribing to data...")
	case <-time.After(5 * time.Second):
		log.Println("MSFS: Timeout waiting for sim ready, proceeding anyway...")
	}

	connector.subscribeToData()

	log.Printf("MSFS: Connected to Flight Simulator")

	// Start position updates
	go connector.UpdatePosition()

	return connector, nil
}

func (m *MsfsConnector ) subscribeToData() {
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
		if pair.name == "TITLE" {
			// Add string data definition
			m.simConnect.AddToDataDefinition(defineID, pair.name, pair.unit, simconnect.DataTypeString256)
		} else {
			// Add numeric data definition
			m.simConnect.AddToDataDefinition(defineID, pair.name, pair.unit, simconnect.DataTypeFloat64)
		}

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
	log.Printf("MSFS: Subscribed to %d SimVars", len(m.simVars))
}

func (m *MsfsConnector ) GetConnectionStatus() bool {
	return m.FsData.Connected
}

func (m *MsfsConnector ) GetAircraftName() string {
	return strings.TrimSpace(m.FsData.AircraftName)
}

func (m *MsfsConnector ) SwitchCom1() error {
	// Parse current frequencies
	activeFloat, err := strconv.ParseFloat(m.FsData.Com1Act, 64)
	if err != nil {
		return fmt.Errorf("invalid active frequency format: %v", err)
	}
	standbyFloat, err := strconv.ParseFloat(m.FsData.Com1Stby, 64)
	if err != nil {
		return fmt.Errorf("invalid standby frequency format: %v", err)
	}
	
	// Send swapped frequencies to sim (convert from KHz to Hz)
	// Set new active (was standby)
	freqHz := uint32((standbyFloat / 1000) * 1000000)
	if err := m.triggerEventWithData("COM_RADIO_SET_HZ", simconnect.DWord(freqHz)); err != nil {
		return err
	}
	
	// Set new standby (was active)
	freqHz = uint32((activeFloat / 1000) * 1000000)
	if err := m.triggerEventWithData("COM_STBY_RADIO_SET_HZ", simconnect.DWord(freqHz)); err != nil {
		return err
	}
	
	log.Printf("MSFS: Swapped COM1 - New Active: %.3f MHz, New Standby: %.3f MHz", standbyFloat/1000, activeFloat/1000)
	return nil
}

func (m *MsfsConnector ) SwitchCom2() error {
	// Parse current frequencies
	activeFloat, err := strconv.ParseFloat(m.FsData.Com2Act, 64)
	if err != nil {
		return fmt.Errorf("invalid active frequency format: %v", err)
	}
	standbyFloat, err := strconv.ParseFloat(m.FsData.Com2Stby, 64)
	if err != nil {
		return fmt.Errorf("invalid standby frequency format: %v", err)
	}
	
	// Send swapped frequencies to sim (convert from KHz to Hz)
	// Set new active (was standby)
	freqHz := uint32((standbyFloat / 1000) * 1000000)
	if err := m.triggerEventWithData("COM2_RADIO_SET_HZ", simconnect.DWord(freqHz)); err != nil {
		return err
	}
	
	// Set new standby (was active)
	freqHz = uint32((activeFloat / 1000) * 1000000)
	if err := m.triggerEventWithData("COM2_STBY_RADIO_SET_HZ", simconnect.DWord(freqHz)); err != nil {
		return err
	}
	
	log.Printf("MSFS: Swapped COM2 - New Active: %.3f MHz, New Standby: %.3f MHz", standbyFloat/1000, activeFloat/1000)
	return nil
}

func (m *MsfsConnector ) SetCom1Stby(frequency string) error {
	freqFloat, err := strconv.ParseFloat(frequency, 64)
	if err != nil {
		return fmt.Errorf("invalid frequency format: %v", err)
	}
	// Frequency comes in as KHz without decimal (e.g., "122800" for 122.800 MHz)
	// Convert to MHz by dividing by 1000, then to Hz by multiplying by 1000000
	freqHz := uint32((freqFloat / 1000) * 1000000)
	return m.triggerEventWithData("COM_STBY_RADIO_SET_HZ", simconnect.DWord(freqHz))
}

func (m *MsfsConnector ) SetCom2Stby(frequency string) error {
	freqFloat, err := strconv.ParseFloat(frequency, 64)
	if err != nil {
		return fmt.Errorf("invalid frequency format: %v", err)
	}
	// Frequency comes in as KHz without decimal (e.g., "122800" for 122.800 MHz)
	// Convert to MHz by dividing by 1000, then to Hz by multiplying by 1000000
	freqHz := uint32((freqFloat / 1000) * 1000000)
	return m.triggerEventWithData("COM2_STBY_RADIO_SET_HZ", simconnect.DWord(freqHz))
}

// ----------------- MSFS specific methods -----------------

func (m *MsfsConnector ) HandleEvents() {
	defer func() {
		if m.simConnect != nil {
			m.simConnect.Close()
		}
	}()

	for {
		select {
		case <-m.done:
			log.Printf("MSFS: Event handler stopped")
			return
		default:
			// Check for incoming dispatches from SimConnect
			ppData, r1, err := m.simConnect.GetNextDispatch()
			if r1 < 0 {
				if uint32(r1) != simconnect.EFail {
					log.Printf("MSFS: GetNextDispatch error: %d %s", r1, err)
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
				log.Println("MSFS: SimConnect opened, signaling ready")
				m.updateConnection(true)
				// Signal that sim is ready for subscriptions
				select {
				case m.simReady <- true:
				default:
				}

			case simconnect.RecvIDQuit:
				log.Println("MSFS: Disconnected from Flight Simulator")
				m.updateConnection(false)
				m.done <- true
				return

			case simconnect.RecvIDException:
				recvException := *(*simconnect.RecvException)(ppData)
				exceptionName := m.getExceptionName(recvException.Exception)
				log.Printf("MSFS: SimConnect Exception %d (%s) - SendID: %d, Index: %d", 
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

func (m *MsfsConnector ) processSimObjectData(ppData unsafe.Pointer, defineID simconnect.DWord) {
	if simVar, exists := m.simVarLookup[defineID]; exists {
		// Calculate data offset - skip the RecvSimObjectData header
		dataOffset := unsafe.Sizeof(simconnect.RecvSimObjectData{})

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
				log.Printf("MSFS: Aircraft changed to '%s'", m.FsData.AircraftName)
				m.app.SetAircraftName(m.FsData.AircraftName)
				m.app.SetFsData(m.FsData)
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
					newVal := fmt.Sprintf("%.0f", val*1000)
					log.Printf("MSFS: COM1 Active: %.3f MHz", val)
					m.FsData.Com1Act = newVal
					m.app.SetFsData(m.FsData)
				case "COM STANDBY FREQUENCY:1":
					newVal := fmt.Sprintf("%.0f", val*1000)
					log.Printf("MSFS: COM1 Standby: %.3f MHz", val)
					m.FsData.Com1Stby = newVal
					m.app.SetFsData(m.FsData)
				case "COM ACTIVE FREQUENCY:2":
					newVal := fmt.Sprintf("%.0f", val*1000)
					log.Printf("MSFS: COM2 Active: %.3f MHz", val)
					m.FsData.Com2Act = newVal
					m.app.SetFsData(m.FsData)
				case "COM STANDBY FREQUENCY:2":
					newVal := fmt.Sprintf("%.0f", val*1000)
					log.Printf("MSFS: COM2 Standby: %.3f MHz", val)
					m.FsData.Com2Stby = newVal
					m.app.SetFsData(m.FsData)
				case "PLANE LATITUDE":
					m.currentLat = val
					// Send initial position update once, then handled by UpdatePosition ticker
					if !m.positionInitialized && m.currentLat != 0 && m.currentLon != 0 {
						m.positionInitialized = true
						m.FsData.Position.Lat = m.currentLat
						m.FsData.Position.Lon = m.currentLon
						m.app.SetFsData(m.FsData)
						log.Printf("MSFS: Initial position set - Lat: %.6f, Lon: %.6f", m.currentLat, m.currentLon)
					}
				case "PLANE LONGITUDE":
					m.currentLon = val
					// Send initial position update once, then handled by UpdatePosition ticker
					if !m.positionInitialized && m.currentLat != 0 && m.currentLon != 0 {
						m.positionInitialized = true
						m.FsData.Position.Lat = m.currentLat
						m.FsData.Position.Lon = m.currentLon
						m.app.SetFsData(m.FsData)
						log.Printf("MSFS: Initial position set - Lat: %.6f, Lon: %.6f", m.currentLat, m.currentLon)
					}
				}
			}
		}
	}
}

func (m *MsfsConnector ) UpdatePosition() {
	ticker := time.NewTicker(120 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-m.done:
			return
		case <-ticker.C:
			// Update position in FsData and send
			m.FsData.Position.Lat = m.currentLat
			m.FsData.Position.Lon = m.currentLon
			m.app.SetFsData(m.FsData)
		}
	}
}

func (m *MsfsConnector ) triggerEvent(eventName string) error {
	// Get or create event ID for this event name
	eventID, exists := m.eventCache[eventName]
	if !exists {
		eventID = simconnect.NewEventID()
		m.simConnect.MapClientEventToSimEvent(eventID, eventName)
		m.simConnect.AddClientEventToNotificationGroup(m.groupID, eventID, false)
		m.simConnect.SetNotificationGroupPriority(m.groupID, simconnect.GroupPriorityHighest)
		m.eventCache[eventName] = eventID
	}

	err := m.simConnect.TransmitClientEvent(
		uint32(simconnect.ObjectIDUser),
		uint32(eventID),
		simconnect.DWordZero,
		m.groupID,
		simconnect.EventFlagGroupIDIsPriority,
	)
	if err != nil {
		log.Printf("MSFS: Failed to trigger event %s: %v", eventName, err)
		return err
	}
	log.Printf("MSFS: Triggered event %s", eventName)
	return nil
}

func (m *MsfsConnector ) triggerEventWithData(eventName string, data simconnect.DWord) error {
	// Get or create event ID for this event name
	eventID, exists := m.eventCache[eventName]
	if !exists {
		eventID = simconnect.NewEventID()
		m.simConnect.MapClientEventToSimEvent(eventID, eventName)
		m.simConnect.AddClientEventToNotificationGroup(m.groupID, eventID, false)
		m.simConnect.SetNotificationGroupPriority(m.groupID, simconnect.GroupPriorityHighest)
		m.eventCache[eventName] = eventID
	}

	err := m.simConnect.TransmitClientEvent(
		uint32(simconnect.ObjectIDUser),
		uint32(eventID),
		data,
		m.groupID,
		simconnect.EventFlagGroupIDIsPriority,
	)
	if err != nil {
		log.Printf("MSFS: Failed to trigger event %s with data %d: %v", eventName, data, err)
		return err
	}
	log.Printf("MSFS: Triggered event %s with data %d", eventName, data)
	return nil
}

func (m *MsfsConnector ) updateConnection(connected bool) {
	m.FsData.Connected = connected
	m.app.SetFsData(m.FsData)
	m.app.SetConnectionStatus(connected)
}

func (m *MsfsConnector ) getExceptionName(exception simconnect.DWord) string {
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
		23: "LOAD_FLIGHTPLAN_FAILED",
		24: "OPERATION_INVALID_FOR_OBJECT_TYPE",
		25: "ILLEGAL_OPERATION",
		26: "ALREADY_SUBSCRIBED",
		27: "INVALID_ENUM",
		28: "DEFINITION_ERROR",
		29: "DUPLICATE_ID",
		30: "DATUM_ID",
		31: "OUT_OF_BOUNDS",
		32: "ALREADY_CREATED",
	}
	if name, ok := names[exception]; ok {
		return name
	}
	return "UNKNOWN"
}
