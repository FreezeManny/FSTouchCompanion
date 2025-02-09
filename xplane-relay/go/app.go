package main

import (
	"flag"
	"log"
	"net/http"
	"net/url"

	"github.com/koding/websocketproxy"
)

var (
	flagBackend = flag.String("backend", "", "Backend URL for proxying")
)

func main() {
	u, err := url.Parse(*flagBackend)
	if err != nil {
		log.Fatalln(err)
	}

	log.Println("Starting the application...")

	err = http.ListenAndServe(":80", websocketproxy.NewProxy(u))
	if err != nil {
		log.Fatalln(err)
	}
}
