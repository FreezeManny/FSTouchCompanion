import { writable, derived } from "svelte/store";
import type { Writable, Readable } from "svelte/store";

export interface Position {
  Lon: number;
  Lat: number;
}

export interface FsDataType {
  Connected: boolean;
  Position: Position;
  Com1Stby: string;
  Com1Act: string;
  Com2Stby: string;
  Com2Act: string;
}

export interface WebSocketState {
  isConnected: boolean;
  connectionError: string;
  fsData: FsDataType;
}

// Create writable stores
export const websocketStore: Writable<WebSocket | null> = writable(null);
export const isWebSocketOpen: Writable<boolean> = writable(false);
export const connectionError: Writable<string> = writable("");
export const fsData: Writable<FsDataType> = writable({
  Connected: false,
  Position: { Lon: 0.0, Lat: 0.0 },
  Com1Stby: "------",
  Com1Act: "------",
  Com2Stby: "------",
  Com2Act: "------",
});

// Helper functions to send commands
export function com1Switch(ws: WebSocket | null): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  console.log("COM1 Switched");
  ws.send(JSON.stringify({ com1Switch: true }));
}

export function com2Switch(ws: WebSocket | null): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  console.log("COM2 Switched");
  ws.send(JSON.stringify({ com2Switch: true }));
}

export function com1Entry(ws: WebSocket | null, frequency: string | number): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  console.log("COM1 Frequency Changed to: " + frequency);
  ws.send(JSON.stringify({ com1Stby: String(frequency) }));
}

export function com2Entry(ws: WebSocket | null, frequency: string | number): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  console.log("COM2 Frequency Changed to: " + frequency);
  ws.send(JSON.stringify({ com2Stby: String(frequency) }));
}
