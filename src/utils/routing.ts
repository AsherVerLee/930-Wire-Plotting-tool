import type { TerminalType } from "@/types/diagram";

export interface Point { x: number; y: number }

export function manhattanPath(a: Point, b: Point, offset = 0): string {
  // Simple 2-segment orthogonal path with optional offset to avoid overlap
  const midX = Math.round((a.x + b.x) / 2);
  const o = offset;
  return `M ${a.x + o},${a.y + o} L ${midX + o},${a.y + o} L ${midX + o},${b.y + o} L ${b.x + o},${b.y + o}`;
}

export function strokeWidthForGauge(gauge: number): number {
  // Map AWG to pixels (approx)
  const map: Record<number, number> = {
    10: 5,
    12: 4.5,
    14: 4,
    16: 3.2,
    18: 2.6,
    20: 2.2,
    22: 1.8,
  };
  return map[gauge] ?? 2.5;
}

export function offsetForPair(type: TerminalType): number {
  // Slight separation for logical pairs if rendered together
  if (type === "canH" || type === "canL") return 3;
  if (type === "power+" || type === "power-") return 3.5;
  if (type === "signal+" || type === "signal-") return 2.5;
  return 0;
}
