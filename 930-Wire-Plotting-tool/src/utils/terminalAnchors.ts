/**
 * 🎯 Cardinal Terminal Anchor System
 * 
 * Professional terminal anchor model with precise world coordinate calculation,
 * cardinal directions, and proper wire exit behavior.
 */

export type Cardinal = 'N' | 'E' | 'S' | 'W';

export interface TerminalAnchor {
  id: string;
  // Local position on the part (normalized 0..1 coordinates)
  local: { x: number; y: number };
  normal: Cardinal;          // face direction (wire exits this way)
  label?: string;            // e.g., CH0, CH1, ... or VRM+
  currentRating?: string;    // e.g., "40A", "30A", "20A"
}

export interface WorldAnchor extends TerminalAnchor {
  world: { x: number; y: number };
}

export interface PartInstance {
  id: string;
  type: string;              // 'CTRE_PDP_1_0' | 'CTRE_PDP_2_0' | ...
  transform: { x: number; y: number; rotation: 0 | 90 | 180 | 270; scale: 1 };
  anchors: TerminalAnchor[]; // terminal anchors in part-space
  bbox: { x: number; y: number; w: number; h: number }; // part-space
}

/**
 * Converts a terminal anchor from part-space to world coordinates
 */
export function toWorldAnchor(part: PartInstance, anchor: TerminalAnchor): WorldAnchor {
  const { transform } = part;
  
  // Convert normalized coordinates to pixel coordinates
  const localX = anchor.local.x * part.bbox.w;
  const localY = anchor.local.y * part.bbox.h;
  
  // Apply rotation (90° steps only)
  let rotatedX = localX;
  let rotatedY = localY;
  let rotatedNormal = anchor.normal;
  
  switch (transform.rotation) {
    case 90:
      rotatedX = -localY;
      rotatedY = localX;
      rotatedNormal = rotateCardinal(anchor.normal, 90);
      break;
    case 180:
      rotatedX = -localX;
      rotatedY = -localY;
      rotatedNormal = rotateCardinal(anchor.normal, 180);
      break;
    case 270:
      rotatedX = localY;
      rotatedY = -localX;
      rotatedNormal = rotateCardinal(anchor.normal, 270);
      break;
  }
  
  // Apply scale and translation
  const worldX = transform.x + (rotatedX * transform.scale);
  const worldY = transform.y + (rotatedY * transform.scale);
  
  return {
    ...anchor,
    normal: rotatedNormal,
    world: { x: worldX, y: worldY }
  };
}

/**
 * Rotates a cardinal direction by degrees (90° increments)
 */
function rotateCardinal(cardinal: Cardinal, degrees: number): Cardinal {
  const directions: Cardinal[] = ['N', 'E', 'S', 'W'];
  const currentIndex = directions.indexOf(cardinal);
  const steps = (degrees / 90) % 4;
  const newIndex = (currentIndex + steps + 4) % 4;
  return directions[newIndex];
}

/**
 * Gets the opposite cardinal direction
 */
export function oppositeCardinal(cardinal: Cardinal): Cardinal {
  const opposites: Record<Cardinal, Cardinal> = {
    'N': 'S',
    'E': 'W', 
    'S': 'N',
    'W': 'E'
  };
  return opposites[cardinal];
}

/**
 * Gets a unit vector for a cardinal direction
 */
export function cardinalToVector(cardinal: Cardinal): { x: number; y: number } {
  const vectors: Record<Cardinal, { x: number; y: number }> = {
    'N': { x: 0, y: -1 },
    'E': { x: 1, y: 0 },
    'S': { x: 0, y: 1 },
    'W': { x: -1, y: 0 }
  };
  return vectors[cardinal];
}

/**
 * Cache for world anchors to avoid recalculation every frame
 */
const worldAnchorCache = new Map<string, WorldAnchor>();
let cacheFrameId = 0;

export function invalidateWorldAnchorCache() {
  cacheFrameId++;
  worldAnchorCache.clear();
}

export function getCachedWorldAnchor(part: PartInstance, anchor: TerminalAnchor): WorldAnchor {
  const cacheKey = `${part.id}-${anchor.id}-${cacheFrameId}`;
  
  if (!worldAnchorCache.has(cacheKey)) {
    worldAnchorCache.set(cacheKey, toWorldAnchor(part, anchor));
  }
  
  return worldAnchorCache.get(cacheKey)!;
}
