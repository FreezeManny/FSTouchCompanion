package fsConnector

import (
	dataTypes "fsConnector/backend/Types"
)

type FsDataInterface interface {
	SetFsData(data dataTypes.FsData)

	SetConnectionStatus(status bool)
	SetAircraftName(name string)
}

type FsConnector interface {
	SwitchCom1() error
	SwitchCom2() error

	SetCom1Stby(frequency string) error
	SetCom2Stby(frequency string) error
}
