package main

import (
	"embed"
	"log"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/build
var assets embed.FS

//go:embed SimConnect.dll
var simConnectDLL []byte

// extractSimConnectDLL extracts the embedded SimConnect.dll to the application directory
func extractSimConnectDLL() error {
	// Get the executable directory
	exePath, err := os.Executable()
	if err != nil {
		return err
	}
	exeDir := filepath.Dir(exePath)
	dllPath := filepath.Join(exeDir, "SimConnect.dll")

	// Check if DLL already exists
	if _, err := os.Stat(dllPath); err == nil {
		// DLL exists, check if it needs updating by comparing sizes
		info, _ := os.Stat(dllPath)
		if int(info.Size()) == len(simConnectDLL) {
			log.Println("SimConnect.dll already exists and is up to date")
			return nil
		}
	}

	// Write the embedded DLL to disk
	log.Printf("Extracting SimConnect.dll to %s", dllPath)
	err = os.WriteFile(dllPath, simConnectDLL, 0644)
	if err != nil {
		return err
	}

	log.Println("SimConnect.dll extracted successfully")
	return nil
}

func main() {
	// Extract SimConnect.dll before starting the app
	if err := extractSimConnectDLL(); err != nil {
		log.Printf("Warning: Failed to extract SimConnect.dll: %v", err)
	}

	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:         "fsConnect",
		Width:         500,
		Height:        300,
		DisableResize: true,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
