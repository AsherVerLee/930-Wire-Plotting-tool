/**
 * 🎯 Rectilinear A* Wire Router
 * 
 * Professional cardinal-only wire routing with A* pathfinding, obstacle avoidance,
 * and proper terminal face exit behavior. No diagonals ever.
 */

import type { WorldAnchor, Cardinal } from "@/utils/terminalAnchors";
import { cardinalToVector, oppositeCardinal } from "@/utils/terminalAnchors";

// Configuration constants
export const ROUTING_CONFIG = {
  gridSize: 10,              // Grid cell size in pixels
  obstacleMargin: 8,         // Extra clearance around components
  wireSpacing: 12,           // Minimum spacing between parallel wires
  bendCost: 10,              // Cost penalty for 90° turns
  nearObstaclePenalty: 2,    // Small cost for traveling near obstacles
  parallelOverlapPenalty: 50, // High cost to prevent wire overlap
  maxIterations: 2000,       // Safety limit for A* search
  pathTimeout: 5             // Max milliseconds for pathfinding
} as const;

export interface Point {
  x: number;
  y: number;
}

export interface GridPoint {
  x: number;
  y: number;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RouteRequest {
  from: WorldAnchor;
  to: WorldAnchor;
  obstacles: Obstacle[];
  existingWires: Point[][];
}

export interface RouteResult {
  success: boolean;
  path: Point[];
  cost: number;
  message?: string;
}

/**
 * Grid-based A* node for pathfinding
 */
interface AStarNode {
  x: number;
  y: number;
  gCost: number;      // Cost from start
  hCost: number;      // Heuristic cost to goal
  fCost: number;      // Total cost (g + h)
  parent: AStarNode | null;
  direction?: Cardinal; // Direction we arrived from
}

/**
 * Convert world coordinates to grid coordinates
 */
function worldToGrid(point: Point): GridPoint {
  return {
    x: Math.round(point.x / ROUTING_CONFIG.gridSize),
    y: Math.round(point.y / ROUTING_CONFIG.gridSize)
  };
}

/**
 * Convert grid coordinates to world coordinates
 */
function gridToWorld(point: GridPoint): Point {
  return {
    x: point.x * ROUTING_CONFIG.gridSize,
    y: point.y * ROUTING_CONFIG.gridSize
  };
}

/**
 * Calculate Manhattan distance between two grid points
 */
function manhattanDistance(a: GridPoint, b: GridPoint): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Check if a grid point is inside any obstacle
 */
function isPointBlocked(point: GridPoint, obstacles: Obstacle[], wireOccupancy: Set<string>): boolean {
  const worldPoint = gridToWorld(point);
  
  // Check obstacle collision
  for (const obs of obstacles) {
    if (worldPoint.x >= obs.x && 
        worldPoint.x <= obs.x + obs.width &&
        worldPoint.y >= obs.y && 
        worldPoint.y <= obs.y + obs.height) {
      return true;
    }
  }
  
  // Check wire occupancy
  const key = `${point.x},${point.y}`;
  return wireOccupancy.has(key);
}

/**
 * Get neighboring grid points (4-connected, cardinal only)
 */
function getNeighbors(point: GridPoint): Array<{point: GridPoint, direction: Cardinal}> {
  return [
    { point: { x: point.x, y: point.y - 1 }, direction: 'N' as Cardinal },
    { point: { x: point.x + 1, y: point.y }, direction: 'E' as Cardinal },
    { point: { x: point.x, y: point.y + 1 }, direction: 'S' as Cardinal },
    { point: { x: point.x - 1, y: point.y }, direction: 'W' as Cardinal }
  ];
}

/**
 * Build wire occupancy grid from existing wires
 */
function buildWireOccupancy(existingWires: Point[][]): Set<string> {
  const occupancy = new Set<string>();
  
  for (const wire of existingWires) {
    for (let i = 0; i < wire.length - 1; i++) {
      const from = worldToGrid(wire[i]);
      const to = worldToGrid(wire[i + 1]);
      
      // Add all points along the wire segment
      const dx = Math.sign(to.x - from.x);
      const dy = Math.sign(to.y - from.y);
      
      let current = { ...from };
      while (current.x !== to.x || current.y !== to.y) {
        // Add spacing around the wire
        for (let ox = -1; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            if (ox === 0 && oy === 0) continue; // Allow perpendicular crossings at exact point
            const key = `${current.x + ox},${current.y + oy}`;
            occupancy.add(key);
          }
        }
        
        if (current.x !== to.x) current.x += dx;
        if (current.y !== to.y) current.y += dy;
      }
    }
  }
  
  return occupancy;
}

/**
 * A* pathfinding algorithm for rectilinear routing
 */
function findPath(
  startGrid: GridPoint,
  goalGrid: GridPoint,
  startDirection: Cardinal,
  goalDirection: Cardinal,
  obstacles: Obstacle[],
  wireOccupancy: Set<string>
): AStarNode[] | null {
  
  const openSet: AStarNode[] = [];
  const closedSet = new Set<string>();
  
  // Create start node with mandatory first step
  const startVector = cardinalToVector(startDirection);
  const mandatoryFirst: GridPoint = {
    x: startGrid.x + startVector.x,
    y: startGrid.y + startVector.y
  };
  
  const startNode: AStarNode = {
    x: mandatoryFirst.x,
    y: mandatoryFirst.y,
    gCost: 1, // Cost of mandatory first step
    hCost: manhattanDistance(mandatoryFirst, goalGrid),
    fCost: 0,
    parent: null,
    direction: startDirection
  };
  startNode.fCost = startNode.gCost + startNode.hCost;
  
  openSet.push(startNode);
  
  let iterations = 0;
  const startTime = performance.now();
  
  while (openSet.length > 0 && iterations < ROUTING_CONFIG.maxIterations) {
    iterations++;
    
    // Check timeout
    if (performance.now() - startTime > ROUTING_CONFIG.pathTimeout) {
      console.warn('A* pathfinding timeout');
      break;
    }
    
    // Get node with lowest fCost
    openSet.sort((a, b) => a.fCost - b.fCost);
    const current = openSet.shift()!;
    
    const currentKey = `${current.x},${current.y}`;
    closedSet.add(currentKey);
    
    // Check if we've reached the goal
    if (current.x === goalGrid.x && current.y === goalGrid.y) {
      const path: AStarNode[] = [];
      let node: AStarNode | null = current;
      while (node) {
        path.unshift(node);
        node = node.parent;
      }
      return path;
    }
    
    // Explore neighbors
    const neighbors = getNeighbors({ x: current.x, y: current.y });
    
    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.point.x},${neighbor.point.y}`;
      
      if (closedSet.has(neighborKey)) continue;
      if (isPointBlocked(neighbor.point, obstacles, wireOccupancy)) continue;
      
      // Calculate costs
      let gCost = current.gCost + 1;
      
      // Add bend penalty if direction changed
      if (current.direction && current.direction !== neighbor.direction) {
        gCost += ROUTING_CONFIG.bendCost;
      }
      
      // Add penalty for being near obstacles (encourages hugging without collision)
      const nearObstacle = obstacles.some(obs => {
        const worldPoint = gridToWorld(neighbor.point);
        const expandedObs = {
          x: obs.x - ROUTING_CONFIG.obstacleMargin,
          y: obs.y - ROUTING_CONFIG.obstacleMargin,
          width: obs.width + 2 * ROUTING_CONFIG.obstacleMargin,
          height: obs.height + 2 * ROUTING_CONFIG.obstacleMargin
        };
        return worldPoint.x >= expandedObs.x && 
               worldPoint.x <= expandedObs.x + expandedObs.width &&
               worldPoint.y >= expandedObs.y && 
               worldPoint.y <= expandedObs.y + expandedObs.height;
      });
      
      if (nearObstacle) {
        gCost += ROUTING_CONFIG.nearObstaclePenalty;
      }
      
      // Check if neighbor is already in open set
      const existingIndex = openSet.findIndex(n => n.x === neighbor.point.x && n.y === neighbor.point.y);
      
      if (existingIndex >= 0) {
        if (gCost < openSet[existingIndex].gCost) {
          openSet[existingIndex].gCost = gCost;
          openSet[existingIndex].fCost = gCost + openSet[existingIndex].hCost;
          openSet[existingIndex].parent = current;
          openSet[existingIndex].direction = neighbor.direction;
        }
      } else {
        const newNode: AStarNode = {
          x: neighbor.point.x,
          y: neighbor.point.y,
          gCost,
          hCost: manhattanDistance(neighbor.point, goalGrid),
          fCost: 0,
          parent: current,
          direction: neighbor.direction
        };
        newNode.fCost = newNode.gCost + newNode.hCost;
        openSet.push(newNode);
      }
    }
  }
  
  return null; // No path found
}

/**
 * Post-process path to merge collinear segments and clean up
 */
function optimizePath(path: Point[]): Point[] {
  if (path.length <= 2) return path;
  
  const optimized: Point[] = [path[0]];
  
  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const current = path[i];
    const next = path[i + 1];
    
    // Check if points are collinear
    const dx1 = current.x - prev.x;
    const dy1 = current.y - prev.y;
    const dx2 = next.x - current.x;
    const dy2 = next.y - current.y;
    
    // If not collinear (direction changed), keep the point
    if (dx1 !== dx2 || dy1 !== dy2) {
      optimized.push(current);
    }
  }
  
  optimized.push(path[path.length - 1]);
  return optimized;
}

/**
 * Main routing function - finds optimal rectilinear path between terminals
 */
export function routeWire(request: RouteRequest): RouteResult {
  try {
    const startTime = performance.now();
    
    // Convert to grid coordinates
    const startGrid = worldToGrid(request.from.world);
    const goalGrid = worldToGrid(request.to.world);
    
    // Build wire occupancy grid
    const wireOccupancy = buildWireOccupancy(request.existingWires);
    
    // Inflate obstacles
    const inflatedObstacles = request.obstacles.map(obs => ({
      x: obs.x - ROUTING_CONFIG.obstacleMargin,
      y: obs.y - ROUTING_CONFIG.obstacleMargin,
      width: obs.width + 2 * ROUTING_CONFIG.obstacleMargin,
      height: obs.height + 2 * ROUTING_CONFIG.obstacleMargin
    }));
    
    // Find path using A*
    const pathNodes = findPath(
      startGrid,
      goalGrid,
      request.from.normal,
      oppositeCardinal(request.to.normal),
      inflatedObstacles,
      wireOccupancy
    );
    
    if (!pathNodes) {
      return {
        success: false,
        path: [],
        cost: Infinity,
        message: 'No path found'
      };
    }
    
    // Convert grid path to world coordinates
    const worldPath = [
      request.from.world,
      ...pathNodes.map(node => gridToWorld({ x: node.x, y: node.y })),
      request.to.world
    ];
    
    // Optimize path by merging collinear segments
    const optimizedPath = optimizePath(worldPath);
    
    const totalCost = pathNodes[pathNodes.length - 1]?.gCost || 0;
    const routingTime = performance.now() - startTime;
    
    return {
      success: true,
      path: optimizedPath,
      cost: totalCost,
      message: `Routed in ${routingTime.toFixed(1)}ms`
    };
    
  } catch (error) {
    console.error('Wire routing error:', error);
    return {
      success: false,
      path: [],
      cost: Infinity,
      message: `Routing failed: ${error}`
    };
  }
}

/**
 * Validate that a path contains only orthogonal segments
 */
export function validateOrthogonalPath(path: Point[]): boolean {
  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    const next = path[i + 1];
    
    // Each segment must be either horizontal or vertical
    const isHorizontal = current.y === next.y;
    const isVertical = current.x === next.x;
    
    if (!isHorizontal && !isVertical) {
      console.error(`Diagonal segment detected: (${current.x},${current.y}) -> (${next.x},${next.y})`);
      return false;
    }
  }
  return true;
}
