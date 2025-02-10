package fsConnector

import (
	"errors"
)

func NewFsConnector(sim string) (FsConnector, error) {
	switch sim {
	case "xplane12":
		return NewXPlane12Connector()
	}
	return nil, errors.New("Not implemented")
}
