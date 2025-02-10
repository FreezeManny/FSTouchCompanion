package fsConnector

import (
	"fmt"
)

type Xp12Connector struct {
	app              FsDataInterface
	connectionStatus bool
}

func NewXPlane12Connector(app FsDataInterface) (FsConnector, error) {
	connector := &Xp12Connector{app: app}
	connector.connectionStatus = false
	return connector, nil
}

func (x *Xp12Connector) GetConnectionStatus() bool {
	return x.connectionStatus
}

func (x *Xp12Connector) SwitchCom1() error {
	// Implement the logic for SwitchCom1
	fmt.Println("X-Plane: SwitchCom1")
	return nil
}

func (x *Xp12Connector) SwitchCom2() error {
	// Implement the logic for SwitchCom2
	fmt.Println("X-Plane: SwitchCom2")
	return nil
}

func (x *Xp12Connector) SetCom1Stby(frequency string) error {
	fmt.Println("X-Plane: Setting COM1 standby to", frequency)
	//x.app.SetFsData(fsData.FsData{Com1Stby: frequency})
	return nil
}

func (x *Xp12Connector) SetCom2Stby(frequency string) error {
	fmt.Println("X-Plane: Setting COM2 standby to", frequency)
	//x.app.SetFsData(fsData.FsData{Com2Stby: frequency})
	return nil
}
