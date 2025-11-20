import { persisted } from "svelte-persisted-store";
import type { Writable } from "svelte/store";

// Type definitions for stores
export interface SelectedAirports {
    dep: string;
    arr: string;
}

export interface ChecklistState {
    aircraft: string;
    section: string;
    checkboxStates: boolean[];
    statesMap?: Record<string, boolean[]>;
    manualAircraftOverride?: boolean;
    lastSimbriefId?: string;
}

export interface Settings {
    appearance: "dark" | "light";
    simbriefUsername: string;
    flightSimAddress: string;
    atcPlatform: "VATSIM" | "IVAO" | string;
}

export interface SimbriefData {
    [key: string]: any; // TODO: Define proper Simbrief data structure
}

export interface FlightplanSettings {
    fontSize: number;
    scrollPosition: number;
}

// Create a writable store that persists to localStorage
export const selectedAirports: Writable<SelectedAirports> = persisted("selectedAirports", {
    dep: "XXXX",
    arr: "XXXX"
});

export const checklistState: Writable<ChecklistState> = persisted("checklistState", {
    aircraft: "",
    section: "",
    checkboxStates: [],
    statesMap: {},
    manualAircraftOverride: false,
    lastSimbriefId: ""
});

export const settings: Writable<Settings> = persisted("settings", {
    appearance: "dark",
    simbriefUsername: "",
    flightSimAddress: "10.0.0.2",
    atcPlatform: "VATSIM",
});

export const simbriefData: Writable<SimbriefData | null> = persisted("simbriefData", null);

export const flightplanSettings: Writable<FlightplanSettings> = persisted("flightplanSettings", {
    fontSize: 15,
    scrollPosition: 0
});
