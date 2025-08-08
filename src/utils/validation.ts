import type { TerminalType } from "@/types/diagram";

const identicalTypesAllowed: TerminalType[] = [
  "ethernet",
  "usb",
  "canH",
  "canL",
  "power+",
  "power-",
  "signal+",
  "signal-",
];

export function canConnect(a: TerminalType, b: TerminalType): boolean {
  // First pass: identical terminal types are connectable
  if (a === b && identicalTypesAllowed.includes(a)) return true;
  // Prevent crossing CAN H <-> L, etc.
  return false;
}
