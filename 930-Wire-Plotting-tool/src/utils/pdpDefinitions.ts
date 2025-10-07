/**
 * 🔌 Precise CTRE PDP Definitions
 * 
 * Exact port layouts for CTRE PDP 1.0 and PDP 2.0 based on official mechanical drawings
 * and user guides. Uses normalized coordinates for resolution independence.
 */

import type { TerminalAnchor } from "@/utils/terminalAnchors";

// CTRE PDP 1.0 (16 channels: 8 per side, vertical banks)
// Visual reference shows two red vertical banks of output channels on left and right edges
const PDP1_LEFT_YS = [0.09, 0.18, 0.27, 0.36, 0.54, 0.63, 0.72, 0.81];
const PDP1_RIGHT_YS = [0.09, 0.18, 0.27, 0.36, 0.54, 0.63, 0.72, 0.81];
const PDP1_MARGIN_X = 0.04; // anchor inset from outer edge

export const PDP1_DEF = {
  type: 'CTRE_PDP_1_0',
  size: { w: 304, h: 192 }, // pixel dimensions for rendering
  anchors: [
    // Left bank (faces West) - Channels 12-15, 4-7
    ...PDP1_LEFT_YS.slice(0, 4).map((y, i) => ({
      id: `CH_L_${i}`,
      local: { x: 0.0 + PDP1_MARGIN_X, y },
      normal: 'W' as const,
      label: `CH${12 + i}`,
      currentRating: '40A' // Channels 12-15 are 40A
    })),
    ...PDP1_LEFT_YS.slice(4, 8).map((y, i) => ({
      id: `CH_L_${i + 4}`,
      local: { x: 0.0 + PDP1_MARGIN_X, y },
      normal: 'W' as const,
      label: `CH${4 + i}`,
      currentRating: '30A' // Channels 4-7 are 30A
    })),
    
    // Right bank (faces East) - Channels 0-3, 8-11  
    ...PDP1_RIGHT_YS.slice(0, 4).map((y, i) => ({
      id: `CH_R_${i}`,
      local: { x: 1.0 - PDP1_MARGIN_X, y },
      normal: 'E' as const,
      label: `CH${i}`,
      currentRating: '40A' // Channels 0-3 are 40A
    })),
    ...PDP1_RIGHT_YS.slice(4, 8).map((y, i) => ({
      id: `CH_R_${i + 4}`,
      local: { x: 1.0 - PDP1_MARGIN_X, y },
      normal: 'E' as const,
      label: `CH${8 + i}`,
      currentRating: '20A' // Channels 8-11 are 20A
    })),
    
    // Weidmuller low-current aux at top edge (faces North)
    { 
      id: 'VRM+', 
      local: { x: 0.60, y: 0.03 }, 
      normal: 'N' as const, 
      label: 'VRM',
      currentRating: '20A'
    },
    { 
      id: 'PCM+', 
      local: { x: 0.70, y: 0.03 }, 
      normal: 'N' as const, 
      label: 'PCM',
      currentRating: '20A'
    },
    { 
      id: 'ROBORIO+', 
      local: { x: 0.80, y: 0.03 }, 
      normal: 'N' as const, 
      label: 'roboRIO',
      currentRating: '10A'
    },
    
    // Main power input (faces South)
    { 
      id: 'BAT+', 
      local: { x: 0.15, y: 0.97 }, 
      normal: 'S' as const, 
      label: 'BAT+',
      currentRating: 'Input'
    },
    { 
      id: 'BAT-', 
      local: { x: 0.25, y: 0.97 }, 
      normal: 'S' as const, 
      label: 'BAT-',
      currentRating: 'Input'
    },
    
    // CAN interface (faces South)
    { 
      id: 'CAN_H', 
      local: { x: 0.75, y: 0.97 }, 
      normal: 'S' as const, 
      label: 'CAN H',
      currentRating: 'Data'
    },
    { 
      id: 'CAN_L', 
      local: { x: 0.85, y: 0.97 }, 
      normal: 'S' as const, 
      label: 'CAN L',
      currentRating: 'Data'
    }
  ] as TerminalAnchor[]
};

// CTRE PDP 2.0 (24 channels: two horizontal rows of 12, top & bottom edges)
// Based on mechanical drawing showing ~9.21″ × 4.08″ with dense output slots
const PDP2_TOP_Y = 0.06;   // slight inset from the top edge
const PDP2_BOT_Y = 0.94;   // slight inset from the bottom edge
const PDP2_XS = Array.from({length: 12}, (_, i) => 0.06 + i * ((1 - 0.12) / 11)); // 12 evenly spaced x slots

export const PDP2_DEF = {
  type: 'CTRE_PDP_2_0',
  size: { w: 368, h: 163 }, // pixel dimensions based on ~9.21" × 4.08" proportions
  anchors: [
    // Top row (faces North) — CH0..CH11
    ...Array.from({length: 12}, (_, i) => ({
      id: `CH_T_${i}`,
      local: { x: PDP2_XS[i], y: PDP2_TOP_Y },
      normal: 'N' as const,
      label: `CH${i}`,
      currentRating: '40A' // All PDP 2.0 channels are 40A
    })),
    
    // Bottom row (faces South) — CH12..CH23
    ...Array.from({length: 12}, (_, i) => ({
      id: `CH_B_${i}`,
      local: { x: PDP2_XS[i], y: PDP2_BOT_Y },
      normal: 'S' as const,
      label: `CH${12 + i}`,
      currentRating: '40A' // All PDP 2.0 channels are 40A
    })),
    
    // Battery studs (face East for neat strain relief)
    { 
      id: 'BAT+', 
      local: { x: 0.96, y: 0.30 }, 
      normal: 'E' as const, 
      label: 'BAT+',
      currentRating: 'Input'
    },
    { 
      id: 'BAT-', 
      local: { x: 0.96, y: 0.70 }, 
      normal: 'E' as const, 
      label: 'BAT-',
      currentRating: 'Input'
    },
    
    // CAN interface (faces East)
    { 
      id: 'CAN_H', 
      local: { x: 0.96, y: 0.45 }, 
      normal: 'E' as const, 
      label: 'CAN H',
      currentRating: 'Data'
    },
    { 
      id: 'CAN_L', 
      local: { x: 0.96, y: 0.55 }, 
      normal: 'E' as const, 
      label: 'CAN L',
      currentRating: 'Data'
    }
  ] as TerminalAnchor[]
};

/**
 * Get stroke width based on current rating
 */
export function getStrokeWidthForRating(rating: string): number {
  switch (rating) {
    case '40A': return 4; // Thick for high current
    case '30A': return 3; // Medium-thick
    case '20A': return 2; // Medium  
    case '10A': return 1; // Thin
    case 'Data': return 1; // Thin for CAN
    case 'Input': return 5; // Thickest for main power
    default: return 2; // Default medium
  }
}

/**
 * Get color based on current rating
 */
export function getColorForRating(rating: string): string {
  switch (rating) {
    case '40A': return '#ff4444'; // Red for high current
    case '30A': return '#ff8844'; // Orange for 30A
    case '20A': return '#ffaa44'; // Yellow-orange for 20A
    case '10A': return '#44ff44'; // Green for low current
    case 'Data': return '#4488ff'; // Blue for data lines
    case 'Input': return '#ff2222'; // Bright red for main power
    default: return '#888888'; // Gray default
  }
}

/**
 * All PDP definitions for the parts library
 */
export const PDP_DEFINITIONS = {
  'CTRE_PDP_1_0': PDP1_DEF,
  'CTRE_PDP_2_0': PDP2_DEF
} as const;
