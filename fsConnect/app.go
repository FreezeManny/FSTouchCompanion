package main

import (
	"context"
	"fmt"
	efbConnector "fsConnector/backend/efbConnector"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	dataTypes "fsConnector/backend/Types"
	fsConnector "fsConnector/backend/fsConnector"
)

// App struct
type App struct {
	ctx context.Context

	// Child Functions
	efbConnector *efbConnector.EfbConnector // Changed to a pointer
	fsConnector  fsConnector.FsConnector

	flightSim string           // FlightSim Type
	fsData    dataTypes.FsData // FlightsimData
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

	a.flightSim = "xplane12"

	// Pass the Wails context to the connector
	connector.SetContext(a.ctx)

	// Pass App (which has the COM methods) to the connector
	connector.SetComInterface(a)

	a.efbConnector = connector
	go func() {
		fmt.Println("Starting WebSocket server...")
		a.efbConnector.StartWebSocketServer() // Start the server here
	}()

	// Create the FsConnector
	fsConn, err := fsConnector.NewFsConnector(a.flightSim, a)
	if err != nil {
		fmt.Println("Error creating FsConnector:", err)
		return
	}

	a.fsConnector = fsConn
}

// ------ Functions for Wails Frontend -------
// ChangeFlightSim changes the flight simulator and updates the fsConnector
func (a *App) ChangeFlightSim(sim string) error {
	a.flightSim = sim
	fsConn, err := fsConnector.NewFsConnector(a.flightSim, a)
	if err != nil {
		fmt.Println("Error changing FsConnector:", err)
		return err
	}

	a.fsConnector = fsConn
	fmt.Println("Flight simulator changed to", a.flightSim)
	return nil
}

// GetConnectionCount returns the number of active WebSocket connections
func (a *App) SetConnectionCount(count int) {
	runtime.EventsEmit(a.ctx, "ConnectionCount", count)
}

func (a *App) SetConnectionStatus(status bool) {
	fmt.Println("Connection Status: ", status)
	runtime.EventsEmit(a.ctx, "ConnectionStatus", status)
}

func (a *App) SetAircraftName(name string) {
	runtime.EventsEmit(a.ctx, "AircraftName", name)
}

func (a *App) ReconnectFlightSim() error {
	fsConn, err := fsConnector.NewFsConnector(a.flightSim, a)
	if err != nil {
		fmt.Println("Error changing FsConnector:", err)
		return err
	}

	a.fsConnector = fsConn
	fmt.Println("Reconnection Attempt to ", a.flightSim)
	return nil
}

//---------------- COM Frontend Call methods ----------------

func (a *App) SwitchCom1() {
	a.fsConnector.SwitchCom1() // Call the SwitchCom1 method on the fsConnector
}

func (a *App) SwitchCom2() {
	a.fsConnector.SwitchCom2() // Call the SwitchCom1 method on the fsConnector
}

func (a *App) SetCom1Stby(frequency string) {
	a.fsConnector.SetCom1Stby(frequency) // Call the SetCom1Stby method on the fsConnector
}

func (a *App) SetCom2Stby(frequency string) {
	a.fsConnector.SetCom2Stby(frequency) // Call the SetCom2Stby method on the fsConnector
}

// ------ fsConnect Interface methods ------
func (a *App) SetFsData(data dataTypes.FsData) {
	a.fsData = data
	a.efbConnector.UpdateFrontendData(a.fsData)
}
