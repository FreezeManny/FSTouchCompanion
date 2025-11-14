package fsConnector

import (
	"fmt"
)

type Msfs2020Connector struct {
	app              FsDataInterface
	connectionStatus bool
}

func NewMsfs2020Connector(app FsDataInterface) (FsConnector, error) {
	connector := &Msfs2020Connector{app: app}
	connector.connectionStatus = false
	return connector, nil
}

func (m *Msfs2020Connector) GetConnectionStatus() bool {
	return m.connectionStatus
}

func (m *Msfs2020Connector) GetAircraftName() string {
	return "MSFS2020 - C172"
}

func (m *Msfs2020Connector) SwitchCom1() error {
	// Implement the logic for SwitchCom1
	fmt.Println("MSFS2020: SwitchCom1")
	return nil
}

func (m *Msfs2020Connector) SwitchCom2() error {
	// Implement the logic for SwitchCom2
	fmt.Println("MSFS2020: SwitchCom2")
	return nil
}

func (m *Msfs2020Connector) SetCom1Stby(frequency string) error {
	fmt.Println("MSFS2020: Setting COM1 standby to", frequency)
	//m.app.SetFsData(fsData.FsData{Com1Stby: frequency})
	return nil
}

func (m *Msfs2020Connector) SetCom2Stby(frequency string) error {
	fmt.Println("MSFS2020: Setting COM2 standby to", frequency)
	//m.app.SetFsData(fsData.FsData{Com2Stby: frequency})
	return nil
}
