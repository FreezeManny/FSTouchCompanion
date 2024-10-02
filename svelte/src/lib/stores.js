import { persisted } from "svelte-persisted-store";

// Create a writable store that persists to localStorage
export const selectedAirports = persisted("selectedAirports", {
    dep: "XXXX",
    arr: "XXXX"
});

export const selectedChecklist = persisted("selectedChecklist", null);

export const settings = persisted("settings", {
    appearance: "dark",
    simbriefUsername: "",
    flightSimAddress: "",
});

export const simbriefData = persisted("simbriefData", null);