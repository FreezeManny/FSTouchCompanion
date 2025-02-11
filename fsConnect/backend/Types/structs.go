package structs

type Position struct {
	Lon float64
	Lat float64
}

type FsData struct {
	Connected    bool
	AircraftName string
	Position     Position
	Com1Stby     string
	Com1Act      string
	Com2Stby     string
	Com2Act      string
}

// FlightsimE
type FlightSim int

const (
	XPlane12 FlightSim = iota
	FS2020
)
