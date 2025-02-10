package fsConnector

import "fmt"

type Xp12Connector struct {
}

func NewXPlane12Connector() (FsConnector, error) {
	return &Xp12Connector{}, nil
}

func (x *Xp12Connector) SwitchCom1() error {
	// Implement the logic for SwitchCom1
	fmt.Println("SwitchCom1")
	return nil
}

func (x *Xp12Connector) SwitchCom2() error {
	// Implement the logic for SwitchCom2
	fmt.Println("SwitchCom2")
	return nil
}

func (x *Xp12Connector) SetCom1Stby(frequency string) error {
	fmt.Println("Setting COM1 standby to", frequency)
	return nil
}

func (x *Xp12Connector) SetCom2Stby(frequency string) error {
	fmt.Println("Setting COM2 standby to", frequency)
	return nil
}
