package fsConnector

type FsConnector interface {
	SwitchCom1() error
	SwitchCom2() error

	SetCom1Stby(frequency string) error
	SetCom2Stby(frequency string) error
}
