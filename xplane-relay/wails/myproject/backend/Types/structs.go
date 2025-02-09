package structs

type position struct {
	lon float64
	lat float64
}

type FsData struct {
	position  position
	aircraft  string
	com1_stby string
	com1_act  string
	com2_stby string
	com2_act  string
}
