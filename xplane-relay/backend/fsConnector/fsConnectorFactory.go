package fsConnector

import (
	"errors"
	fsData "fsConnector/backend/Types"
)

func NewFsConnector(sim fsData.FlightSim, app FsDataInterface) (FsConnector, error) {
	switch sim {
	case fsData.XPlane12:
		return NewXPlane12Connector(app)
	case fsData.FS2020:
		return NewMsfs2020Connector(app)
	}

	return nil, errors.New("Not implemented")
}
