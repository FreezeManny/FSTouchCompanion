
// Central types for FSTouchCompanion

export interface ChecklistState {
  aircraft: string;
  section: string;
  checkboxStates: boolean[][];
  statesMap?: Record<string, boolean[][]>;
}

export type ChecklistItem = Record<string, string | undefined>;

export type ChecklistSectionMap = Record<string, ChecklistItem[] | ChecklistItem>;
export type ChecklistData = Record<string, ChecklistSectionMap>;

export interface FlightPlan {
  id: string;
  origin: string;
  destination: string;
  waypoints: string[];
}

export interface RadioFrequency {
  name: string;
  frequency: number;
}

// Add more shared types as needed
