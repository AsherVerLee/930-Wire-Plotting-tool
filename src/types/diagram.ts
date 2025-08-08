export type TerminalType =
  | "power+"
  | "power-"
  | "canH"
  | "canL"
  | "signal+"
  | "signal-"
  | "ethernet"
  | "usb";

export interface Terminal {
  id: string;
  label: string;
  type: TerminalType;
  // relative position in part local coords
  x: number;
  y: number;
}

export interface PartDefinition {
  key: string; // unique library key
  name: string;
  width: number; // in px units for canvas scale 1
  height: number;
  terminals: Terminal[];
}

export interface PlacedComponent {
  id: string;
  partKey: string;
  name: string; // user label, defaults to part name
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
}

export interface TerminalRef {
  componentId: string;
  terminalId: string;
}

export type Gauge = 18 | 20 | 22 | 16 | 14 | 12 | 10;

export interface WireSegmentPair {
  id: string;
  from: TerminalRef;
  to: TerminalRef;
  type: TerminalType; // determines color coding
  gauge: Gauge;
  netId?: string; // for bus-style chains (e.g., CAN)
}

export interface DiagramStateDto {
  components: PlacedComponent[];
  wires: WireSegmentPair[];
}

export const terminalColors: Record<TerminalType, string> = {
  "power+": "hsl(0 84% 60%)", // red
  "power-": "hsl(220 9% 26%)", // dark gray/blackish
  canH: "hsl(52 100% 50%)", // yellow
  canL: "hsl(120 61% 34%)", // green
  "signal+": "hsl(20 90% 50%)", // orange
  "signal-": "hsl(210 10% 23%)", // brownish/dark
  ethernet: "hsl(204 100% 40%)", // blue
  usb: "hsl(204 100% 40%)", // blue
};
