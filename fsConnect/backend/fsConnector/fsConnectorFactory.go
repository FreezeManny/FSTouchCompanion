package fsConnector

import (
	"errors"
)

func NewFsConnector(sim string, app FsDataInterface) (FsConnector, error) {
	switch sim {
	case "xplane12":
		return NewXPlane12Connector(app)
	case "msfs2020":
		return NewMsfs2020Connector(app)
	}
	return nil, errors.New("Not implemented")
}
