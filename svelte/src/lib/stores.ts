import { persisted } from "svelte-persisted-store";
import type { Writable } from "svelte/store";
import type { ChecklistItem, ChecklistState } from "../types";

// Type definitions for stores
export interface SelectedAirports {
    dep: string;
    arr: string;
}

// ...existing code...

export interface Settings {
    appearance: "dark" | "light";
    simbriefUsername: string;
    flightSimAddress: string;
    atcPlatform: "VATSIM" | "IVAO" | string;
}

export interface SimbriefData {
    [key: string]: any; // TODO: Define proper Simbrief data structure
}

// Create a writable store that persists to localStorage
export const selectedAirports: Writable<SelectedAirports> = persisted("selectedAirports", {
    dep: "XXXX",
    arr: "XXXX"
});

export const checklistState: Writable<ChecklistState> = persisted("checklistState", {
    aircraft: "",
    section: "",
    checkboxStates: []
});

export const settings: Writable<Settings> = persisted("settings", {
    appearance: "dark",
    simbriefUsername: "",
    flightSimAddress: "",
    atcPlatform: "VATSIM",
});

export const simbriefData: Writable<SimbriefData | null> = persisted("simbriefData", null);
