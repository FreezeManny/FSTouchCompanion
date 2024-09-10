import { persisted } from "svelte-persisted-store";

// Create a writable store that persists to localStorage
export const selectedAirports = persisted("selectedAirports", {
    dep: "XXXX",
    arr: "XXXX"
});

export const settings = persisted("settings", {
    simbriefUsername: "",
    flightSimAddress: "",
});

export const simbriefData = persisted("simbriefData", null);