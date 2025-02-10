package fsConnector

import (
	fsData "fsConnector/backend/Types"
)

type FsDataInterface interface {
	SetFsData(data fsData.FsData)
}

type FsConnector interface {
	SwitchCom1() error
	SwitchCom2() error

	SetCom1Stby(frequency string) error
	SetCom2Stby(frequency string) error

	GetConnectionStatus() bool
}
