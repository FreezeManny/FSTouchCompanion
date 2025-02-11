package fsConnector

import (
	"errors"
	dataTypes "fsConnector/backend/Types"
)

func NewFsConnector(sim dataTypes.FlightSim, app FsDataInterface) (FsConnector, error) {
	switch sim {
	case dataTypes.XPlane12:
		return NewXPlane12Connector(app)
	case dataTypes.FS2020:
		return NewMsfs2020Connector(app)
	}
	return nil, errors.New("Not implemented")
}
