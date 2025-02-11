package fsConnector

import (
	FsData "fsConnector/backend/Types"
)

type FsDataInterface interface {
	//SetCom1ActData(frequency string)
	//SetCom1StbData(frequency string)
	//SetCom2ActData(frequency string)
	//SetCom2StbData(frequency string)
	//
	//SetPosition(lon float64, lat float64)
	//
	//SetConnection(status bool)
	GetFsDataReference() *FsData.FsData
}

type FsConnector interface {
	SwitchCom1() error
	SwitchCom2() error

	SetCom1Stby(frequency string) error
	SetCom2Stby(frequency string) error

	GetConnectionStatus() bool

	GetAircraftName() string
}
