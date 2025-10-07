/**
 * 🎯 Enhanced Anchor Terminal Component
 * 
 * Professional terminal component with anchor-based positioning, cardinal directions,
 * and proper wire placement mode integration.
 */

import React from 'react';
import type { WorldAnchor } from '@/utils/terminalAnchors';
import { useWirePlacementState, useWirePlacementActions, getAnchorVisualState } from '@/state/wirePlacementStore';
import { getStrokeWidthForRating, getColorForRating } from '@/utils/pdpDefinitions';

interface AnchorTerminalProps {
  anchor: WorldAnchor;
  scale?: number;
  className?: string;
}

/**
 * Visual styles for different terminal states
 */
const TERMINAL_STYLES = {
  inactive: {
    fill: 'currentColor',
    stroke: 'none',
    strokeWidth: 0,
    opacity: 0.7,
    filter: 'none',
    cursor: 'default'
  },
  available: {
    fill: 'currentColor',
    stroke: 'hsl(210 40% 70%)',
    strokeWidth: 1,
    opacity: 1,
    filter: 'none',
    cursor: 'pointer'
  },
  selected: {
    fill: 'currentColor',
    stroke: 'hsl(200 100% 60%)',
    strokeWidth: 3,
    opacity: 1,
    filter: 'drop-shadow(0 0 8px hsl(200 100% 60% / 0.8))',
    cursor: 'pointer'
  },
  'hovered-valid': {
    fill: 'currentColor',
    stroke: 'hsl(120 100% 60%)',
    strokeWidth: 2,
    opacity: 1,
    filter: 'drop-shadow(0 0 6px hsl(120 100% 60% / 0.6))',
    cursor: 'pointer'
  },
  'hovered-invalid': {
    fill: 'currentColor',
    stroke: 'hsl(0 100% 60%)',
    strokeWidth: 2,
    opacity: 1,
    filter: 'drop-shadow(0 0 6px hsl(0 100% 60% / 0.6))',
    cursor: 'not-allowed'
  },
  compatible: {
    fill: 'currentColor',
    stroke: 'hsl(120 60% 50%)',
    strokeWidth: 1,
    opacity: 1,
    filter: 'drop-shadow(0 0 4px hsl(120 60% 50% / 0.4))',
    cursor: 'pointer'
  },
  incompatible: {
    fill: 'currentColor',
    stroke: 'none',
    strokeWidth: 0,
    opacity: 0.3,
    filter: 'none',
    cursor: 'default'
  }
} as const;

/**
 * Get terminal color based on type and current rating
 */
function getTerminalColor(anchor: WorldAnchor): string {
  if (anchor.currentRating) {
    return getColorForRating(anchor.currentRating);
  }
  
  // Fallback color mapping
  const label = anchor.label?.toLowerCase() || anchor.id.toLowerCase();
  if (label.includes('bat+') || label.includes('power+')) return '#ff4444';
  if (label.includes('bat-') || label.includes('ground') || label.includes('gnd')) return '#000000';
  if (label.includes('can')) return '#4488ff';
  if (label.includes('eth')) return '#44ff44';
  if (label.includes('usb')) return '#ff8844';
  
  return '#888888'; // Default gray
}

export const AnchorTerminal: React.FC<AnchorTerminalProps> = ({
  anchor,
  scale = 1,
  className = ''
}) => {
  const wirePlacementState = useWirePlacementState();
  const { selectAnchor, hoverAnchor } = useWirePlacementActions();

  // Get visual state using the store directly
  const visualState = (() => {
    if (!wirePlacementState.isActive) return 'inactive';
    
    if (wirePlacementState.selectedAnchor?.id === anchor.id) return 'selected';
    if (wirePlacementState.hoveredAnchor?.id === anchor.id) {
      if (wirePlacementState.selectedAnchor) {
        // Check if compatible (simplified check for now)
        return 'hovered-valid';
      }
      return 'hovered-valid';
    }
    
    if (wirePlacementState.selectedAnchor) {
      return 'compatible';
    }
    
    return 'available';
  })();
  
  const styles = TERMINAL_STYLES[visualState];
  const terminalColor = getTerminalColor(anchor);
  
  // Terminal size based on scale and current rating
  const baseRadius = 6;
  const ratingMultiplier = anchor.currentRating === '40A' ? 1.3 : 
                          anchor.currentRating === '30A' ? 1.2 : 
                          anchor.currentRating === '20A' ? 1.1 : 1.0;
  const radius = baseRadius * scale * ratingMultiplier * (visualState === 'selected' ? 1.2 : 1);
  
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    selectAnchor(anchor);
  };

  const handleMouseEnter = () => {
    hoverAnchor(anchor);
  };

  const handleMouseLeave = () => {
    hoverAnchor(null);
  };

  return (
    <g 
      className={`anchor-terminal ${className}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Direction indicator line */}
      {visualState !== 'inactive' && (
        <g>
          {/* Direction indicator showing wire exit direction */}
          {(() => {
            const indicatorLength = radius + 8;
            let x1 = anchor.world.x, y1 = anchor.world.y;
            let x2 = x1, y2 = y1;
            
            switch (anchor.normal) {
              case 'N': y2 = y1 - indicatorLength; break;
              case 'E': x2 = x1 + indicatorLength; break;
              case 'S': y2 = y1 + indicatorLength; break;
              case 'W': x2 = x1 - indicatorLength; break;
            }
            
            return (
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={styles.stroke || terminalColor}
                strokeWidth="1"
                opacity="0.5"
                style={{ pointerEvents: 'none' }}
              />
            );
          })()}
        </g>
      )}
      
      {/* Terminal circle */}
      <circle
        cx={anchor.world.x}
        cy={anchor.world.y}
        r={radius}
        fill={terminalColor}
        stroke={styles.stroke}
        strokeWidth={styles.strokeWidth}
        opacity={styles.opacity}
        style={{
          filter: styles.filter,
          cursor: styles.cursor,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      />
      
      {/* Label */}
      {anchor.label && visualState !== 'inactive' && scale > 0.5 && (
        <text
          x={anchor.world.x}
          y={anchor.world.y - radius - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={`${10 * scale}px`}
          fontFamily="system-ui, sans-serif"
          style={{ 
            pointerEvents: 'none',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
          }}
        >
          {anchor.label}
        </text>
      )}
      
      {/* Current rating indicator for high-current terminals */}
      {anchor.currentRating && ['40A', '30A'].includes(anchor.currentRating) && visualState !== 'inactive' && (
        <circle
          cx={anchor.world.x}
          cy={anchor.world.y}
          r={radius + 3}
          fill="none"
          stroke={getColorForRating(anchor.currentRating)}
          strokeWidth="1"
          opacity="0.6"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </g>
  );
};

/**
 * Wire Placement HUD Component
 */
export const WirePlacementHUD: React.FC = () => {
  const { isActive, selectedAnchor } = useWirePlacementState();
  const { deactivateMode } = useWirePlacementActions();

  if (!isActive) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              {selectedAnchor 
                ? 'Select a destination terminal' 
                : 'Wire placement active — select a source terminal'
              }
            </span>
          </div>
          <button
            onClick={deactivateMode}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ESC to cancel
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * CSS styles for anchor terminals (to be added to global styles)
 */
export const AnchorTerminalStyles = `
/* Anchor Terminal Animations */
@keyframes anchor-pulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

.anchor-terminal.selected circle {
  animation: anchor-pulse 2s ease-in-out infinite;
}

.anchor-terminal:hover {
  filter: brightness(1.1);
}
`;
