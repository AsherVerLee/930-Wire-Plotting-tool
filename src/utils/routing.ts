// Checks if a line segment from (x1,y1) to (x2,y2) crosses any obstacles
function crossesObstacles(x1:number, y1:number, x2:number, y2:number, obstacles: {x:number,y:number,width:number,height:number}[]): boolean {
  for (const obs of obstacles) {
    const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
    // Check horizontal segment
    if (y1 === y2) {
      if (y1 >= obs.y && y1 <= obs.y + obs.height && maxX >= obs.x && minX <= obs.x + obs.width) return true;
    }
    // Check vertical segment
    if (x1 === x2) {
      if (x1 >= obs.x && x1 <= obs.x + obs.width && maxY >= obs.y && minY <= obs.y + obs.height) return true;
    }
  }
  return false;
}

// Adaptive L-shaped path avoiding obstacles
export function adaptiveLPath(a: Point, b: Point, obstacles: {x:number,y:number,width:number,height:number}[]): string {
  // Try horizontal then vertical
  const hFirst = [
    {x: b.x, y: a.y},
  ];
  const vFirst = [
    {x: a.x, y: b.y},
  ];
  // Check if either segment crosses obstacles
  const hBlocked = crossesObstacles(a.x, a.y, b.x, a.y, obstacles) || crossesObstacles(b.x, a.y, b.x, b.y, obstacles);
  const vBlocked = crossesObstacles(a.x, a.y, a.x, b.y, obstacles) || crossesObstacles(a.x, b.y, b.x, b.y, obstacles);
  if (!hBlocked) {
    return `M ${a.x},${a.y} L ${b.x},${a.y} L ${b.x},${b.y}`;
  }
  if (!vBlocked) {
    return `M ${a.x},${a.y} L ${a.x},${b.y} L ${b.x},${b.y}`;
  }
  // If both blocked, route around the closest obstacle edge
  // Find the closest obstacle to the midpoint
  let closest = null, minDist = Infinity;
  for (const obs of obstacles) {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const cx = Math.max(obs.x, Math.min(mx, obs.x + obs.width));
    const cy = Math.max(obs.y, Math.min(my, obs.y + obs.height));
    const dist = Math.abs(mx - cx) + Math.abs(my - cy);
    if (dist < minDist) { minDist = dist; closest = obs; }
  }
  if (closest) {
    // Route above, below, left, or right of the obstacle
    // Pick the direction with the least extra distance
    const options = [
      {x: a.x, y: closest.y - 8}, {x: b.x, y: closest.y - 8}, // above
      {x: a.x, y: closest.y + closest.height + 8}, {x: b.x, y: closest.y + closest.height + 8}, // below
      {x: closest.x - 8, y: a.y}, {x: closest.x - 8, y: b.y}, // left
      {x: closest.x + closest.width + 8, y: a.y}, {x: closest.x + closest.width + 8, y: b.y}, // right
    ];
    // Try each option as a bend point
    for (let i = 0; i < options.length; i += 2) {
      const p1 = options[i], p2 = options[i+1];
      if (!crossesObstacles(a.x, a.y, p1.x, p1.y, obstacles) &&
          !crossesObstacles(p1.x, p1.y, p2.x, p2.y, obstacles) &&
          !crossesObstacles(p2.x, p2.y, b.x, b.y, obstacles)) {
        return `M ${a.x},${a.y} L ${p1.x},${p1.y} L ${p2.x},${p2.y} L ${b.x},${b.y}`;
      }
    }
  }
  // Fallback: straight line
  return `M ${a.x},${a.y} L ${b.x},${b.y}`;
}

// Advanced A* pathfinding for wire routing with cardinal/ordinal preference
export function aStarPath(
  a: Point,
  b: Point,
  obstacles: {x:number,y:number,width:number,height:number}[],
  gridSize = 16,
  maxSteps = 500,
  hvSegments?: { x1:number; y1:number; x2:number; y2:number }[]
): string {
  // Build grid bounds
  const minX = Math.min(a.x, b.x) - 128;
  const minY = Math.min(a.y, b.y) - 128;
  const maxX = Math.max(a.x, b.x) + 128;
  const maxY = Math.max(a.y, b.y) + 128;
  const cols = Math.ceil((maxX - minX) / gridSize);
  const rows = Math.ceil((maxY - minY) / gridSize);

  // Helper to convert canvas coords to grid
  function toGrid(pt: Point) {
    return {
      x: Math.round((pt.x - minX) / gridSize),
      y: Math.round((pt.y - minY) / gridSize)
    };
  }
  function toCanvas(g: {x:number,y:number}) {
    return {
      x: g.x * gridSize + minX,
      y: g.y * gridSize + minY
    };
  }

  // Build obstacle grid
  const grid: number[][] = Array.from({length: rows}, () => Array(cols).fill(0));
  obstacles.forEach(obs => {
    const gx0 = Math.floor((obs.x - minX) / gridSize);
    const gy0 = Math.floor((obs.y - minY) / gridSize);
    const gx1 = Math.ceil((obs.x + obs.width - minX) / gridSize);
    const gy1 = Math.ceil((obs.y + obs.height - minY) / gridSize);
    for (let y = gy0; y < gy1; y++) {
      for (let x = gx0; x < gx1; x++) {
        if (y >= 0 && y < rows && x >= 0 && x < cols) grid[y][x] = 1;
      }
    }
  });

  const start = toGrid(a);
  const goal = toGrid(b);
  const open: any[] = [ {...start, f: 0, g: 0, prev: null, dir: null} ];
  const closed = new Set<string>();
  function key(pt: {x:number,y:number}) { return pt.x+","+pt.y; }
  let found = null;
  
  // Prefer cardinal directions (N,S,E,W) then ordinal (NE,NW,SE,SW)
  const directions: [number, number][] = [
    [0,1],[1,0],[0,-1],[-1,0],  // Cardinal: cost 1.0
    [1,1],[-1,1],[1,-1],[-1,-1] // Ordinal: cost 1.4
  ];

  // Cost parameters (favor straight and not skimming, but keep detour costs reasonable)
  const CARDINAL = 1.0;
  const DIAGONAL = 1.4;
  const BEND_PENALTY = 0.8;    // was 0.25 – much stronger preference for straight
  const NEAR_OBS_PENALTY = 0.05; // was 0.1 – lighter to avoid needless jogs
  const SAME_DIR_WIRE_PENALTY = 4; // was 100 – prefer straightness over huge detours

  const nearObstacle = (gx: number, gy: number) => {
    // any neighbor cell blocked?
    for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++) {
      const x = gx+dx, y = gy+dy;
      if (y<0||y>=rows||x<0||x>=cols) continue;
      if (grid[y][x] === 1) return true;
    }
    return false;
  };

  const onSameDirWire = (from: {x:number;y:number}, to: {x:number;y:number}, dir: [number,number]) => {
    if (!hvSegments || hvSegments.length === 0) return false;
    const fx = from.x * gridSize + minX;
    const fy = from.y * gridSize + minY;
    const tx = to.x * gridSize + minX;
    const ty = to.y * gridSize + minY;
    if (dir[0] !== 0 && dir[1] === 0) {
      // horizontal move near y=fy
      for (const s of hvSegments) {
        if (s.y1 === s.y2 && Math.abs(s.y1 - fy) <= gridSize / 2) {
          const minA = Math.min(fx, tx), maxA = Math.max(fx, tx);
          const minB = Math.min(s.x1, s.x2), maxB = Math.max(s.x1, s.x2);
          if (maxA >= minB && minA <= maxB) return true;
        }
      }
    } else if (dir[1] !== 0 && dir[0] === 0) {
      // vertical move near x=fx
      for (const s of hvSegments) {
        if (s.x1 === s.x2 && Math.abs(s.x1 - fx) <= gridSize / 2) {
          const minA = Math.min(fy, ty), maxA = Math.max(fy, ty);
          const minB = Math.min(s.y1, s.y2), maxB = Math.max(s.y1, s.y2);
          if (maxA >= minB && minA <= maxB) return true;
        }
      }
    }
    return false;
  };
  
  for (let steps = 0; steps < maxSteps && open.length > 0; steps++) {
    open.sort((a,b) => a.f - b.f);
    const curr = open.shift();
    if (!curr) break;
    if (curr.x === goal.x && curr.y === goal.y) { found = curr; break; }
    closed.add(key(curr));
    
    for (let i = 0; i < directions.length; i++) {
      const [dx,dy] = directions[i];
      const nx = curr.x + dx, ny = curr.y + dy;
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      
      // Check if grid cell intersects any obstacle
      if (grid[ny][nx] === 1) continue;
      const k = key({x:nx,y:ny});
      if (closed.has(k)) continue;
      
      // Cost: prefer cardinal directions over diagonal, penalize bends, small penalty near obstacles
      const moveCost = i < 4 ? CARDINAL : DIAGONAL;
      const bend = curr.dir && (curr.dir[0] !== dx || curr.dir[1] !== dy) ? BEND_PENALTY : 0;
      const near = nearObstacle(nx, ny) ? NEAR_OBS_PENALTY : 0;
      const sameWire = onSameDirWire({x:curr.x,y:curr.y}, {x:nx,y:ny}, [dx,dy]) ? SAME_DIR_WIRE_PENALTY : 0;
      const g = (curr.g ?? 0) + moveCost + bend + near + sameWire;
      const h = Math.abs(goal.x - nx) + Math.abs(goal.y - ny);
      const f = g + h;
      open.push({x:nx,y:ny,f,g,prev:curr,dir:[dx,dy]});
    }
  }
  
  // Reconstruct path
  if (!found) return `M ${a.x},${a.y} L ${b.x},${b.y}`;
  const path: Point[] = [];
  let curr: any = found;
  while (curr) {
    path.push(toCanvas(curr));
    curr = curr.prev;
  }
  path.reverse();
  
  // Convert to SVG path with simplified segments (merge collinear points)
  let d = `M ${a.x},${a.y}`;
  let lastDir: string | null = null;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i-1].x;
    const dy = path[i].y - path[i-1].y;
    const dir = `${Math.sign(dx)},${Math.sign(dy)}`;
    if (dir !== lastDir) {
      d += ` L ${path[i].x},${path[i].y}`;
      lastDir = dir;
    }
  }
  if (path.length > 0) {
    const last = path[path.length - 1];
    if (last.x !== b.x || last.y !== b.y) {
      d += ` L ${b.x},${b.y}`;
    }
  }
  return d;
}
import type { TerminalType } from "@/types/diagram";

export interface Point { x: number; y: number }

// Manhattan path that avoids a list of rectangular obstacles
export function manhattanPath(a: Point, b: Point, offset = 0, obstacles?: {x:number,y:number,width:number,height:number}[]): string {
  // If no obstacles, use default path
  if (!obstacles || obstacles.length === 0) {
    const midX = Math.round((a.x + b.x) / 2);
    const o = offset;
    return `M ${a.x + o},${a.y + o} L ${midX + o},${a.y + o} L ${midX + o},${b.y + o} L ${b.x + o},${b.y + o}`;
  }
  // Simple obstacle avoidance: route above all obstacles
  // Find the highest obstacle in the vertical range between a and b
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  let avoidY = minY;
  obstacles.forEach(obs => {
    if (obs.y < maxY && obs.y + obs.height > minY) {
      avoidY = Math.min(avoidY, obs.y) - 16; // route above
    }
  });
  const o = offset;
  return `M ${a.x + o},${a.y + o} L ${a.x + o},${avoidY + o} L ${b.x + o},${avoidY + o} L ${b.x + o},${b.y + o}`;
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
  if (type === "canH" || type === "canL") return 4;       // was 3
  if (type === "power+" || type === "power-") return 5;    // was 3.5
  if (type === "signal+" || type === "signal-") return 3.5; // was 2.5
  return 0;
}

// New: KiCad-style smart router that avoids parts with clearance, supports 0°/45°/90°
export function kiCadRoute(
  a: Point,
  b: Point,
  obstacles: { x: number; y: number; width: number; height: number }[],
  options?: { gridSize?: number; clearance?: number; escape?: number; existingSegments?: { x1:number;y1:number;x2:number;y2:number }[] }
): string {
  const gridSize = options?.gridSize ?? 16;
  const clearance = options?.clearance ?? 10; // how far to stay away from parts
  const escape = options?.escape ?? 24; // how far to step out from the parent part

  const snap = (n: number) => Math.round(n / gridSize) * gridSize;
  const contains = (r: {x:number;y:number;width:number;height:number}, p: Point) =>
    p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;

  // Inflate obstacles for clearance so routed segments don't touch parts
  const inflated = obstacles.map(o => ({
    x: o.x - clearance,
    y: o.y - clearance,
    width: o.width + 2 * clearance,
    height: o.height + 2 * clearance,
  }));

  function escapeFrom(p: Point, toward: Point): Point {
    const host = obstacles.find(o => contains(o, p));
    if (host) {
      const left = p.x - host.x;
      const right = host.x + host.width - p.x;
      const top = p.y - host.y;
      const bottom = host.y + host.height - p.y;
      const min = Math.min(left, right, top, bottom);
      if (min === left) {
        // Move horizontally to the left; keep Y unchanged to ensure horizontal stub
        return { x: snap(host.x - clearance - escape), y: p.y };
      } else if (min === right) {
        // Move horizontally to the right; keep Y unchanged
        return { x: snap(host.x + host.width + clearance + escape), y: p.y };
      } else if (min === top) {
        // Move vertically upward; keep X unchanged
        return { x: p.x, y: snap(host.y - clearance - escape) };
      } else {
        // Move vertically downward; keep X unchanged
        return { x: p.x, y: snap(host.y + host.height + clearance + escape) };
      }
    }
    // Not inside a host: move only along the dominant axis toward the other point
    const dx = toward.x - p.x;
    const dy = toward.y - p.y;
    if (Math.abs(dx) >= Math.abs(dy)) {
      return { x: snap(p.x + Math.sign(dx || 1) * escape), y: p.y };
    } else {
      return { x: p.x, y: snap(p.y + Math.sign(dy || 1) * escape) };
    }
  }

  const aEsc = escapeFrom(a, b);
  const bEsc = escapeFrom(b, a);

  // Straight run fast-path if aligned and clear (do not ride same-direction wire)
  const ridesSameDir = (p: Point, q: Point) => {
    const segs = options?.existingSegments;
    if (!segs || segs.length === 0) return false;
    if (p.y === q.y) {
      const y = p.y;
      const minX = Math.min(p.x, q.x), maxX = Math.max(p.x, q.x);
      return segs.some(s => s.y1 === s.y2 && Math.abs(s.y1 - y) <= gridSize/2 && Math.max(minX, Math.min(s.x1, s.x2)) <= Math.min(maxX, Math.max(s.x1, s.x2)));
    }
    if (p.x === q.x) {
      const x = p.x;
      const minY = Math.min(p.y, q.y), maxY = Math.max(p.y, q.y);
      return segs.some(s => s.x1 === s.x2 && Math.abs(s.x1 - x) <= gridSize/2 && Math.max(minY, Math.min(s.y1, s.y2)) <= Math.min(maxY, Math.max(s.y1, s.y2)));
    }
    return false;
  };
  const clearHV = (p: Point, q: Point) => !crossesObstacles(p.x, p.y, q.x, q.y, inflated);

  let d: string | null = null;
  if ((aEsc.y === bEsc.y || aEsc.x === bEsc.x) && clearHV(aEsc, bEsc) && !ridesSameDir(aEsc, bEsc)) {
    // Build with stubs + straight middle
    d = `M ${a.x},${a.y}`;
    if (aEsc.x !== a.x || aEsc.y !== a.y) d += ` L ${aEsc.x},${aEsc.y}`;
    d += ` L ${bEsc.x},${bEsc.y}`;
    if (bEsc.x !== b.x || bEsc.y !== b.y) d += ` L ${b.x},${b.y}`;
  }

  // Route between escape points using A* on inflated obstacles, if fast path not taken
  let midPath = d ? '' : aStarPath(aEsc, bEsc, inflated, gridSize, 500, options?.existingSegments);

  // Build final path using pure cardinal stubs at both ends
  if (!d) {
    d = `M ${a.x},${a.y}`;
    if (aEsc.x !== a.x && aEsc.y === a.y) {
      d += ` L ${aEsc.x},${aEsc.y}`;
    } else if (aEsc.y !== a.y && aEsc.x === a.x) {
      d += ` L ${aEsc.x},${aEsc.y}`;
    } else if (aEsc.x !== a.x && aEsc.y !== a.y) {
      d += ` L ${aEsc.x},${a.y} L ${aEsc.x},${aEsc.y}`;
    }

    const firstL = midPath.indexOf('L');
    if (firstL !== -1) {
      d += ' ' + midPath.slice(firstL);
    } else {
      d += ` L ${bEsc.x},${bEsc.y}`;
    }

    if (bEsc.x !== b.x && bEsc.y === b.y) {
      d += ` L ${b.x},${b.y}`;
    } else if (bEsc.y !== b.y && bEsc.x === b.x) {
      d += ` L ${b.x},${b.y}`;
    } else if (bEsc.x !== b.x && bEsc.y !== b.y) {
      d += ` L ${bEsc.x},${b.y} L ${b.x},${b.y}`;
    }
  }

  return d;
}
