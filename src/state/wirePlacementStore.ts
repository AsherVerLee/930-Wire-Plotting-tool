/**
 * 🎯 Wire Placement Mode Store
 * 
 * Professional wire placement controller with click-to-connect behavior,
 * anchor selection state management, and connection validation.
 */

import { create } from 'zustand';
import type { WorldAnchor } from '../utils/terminalAnchors';

export interface WirePlacementState {
  // Mode state
  isActive: boolean;
  
  // Selection state
  selectedAnchor: WorldAnchor | null;
  hoveredAnchor: WorldAnchor | null;
  
  // Visual feedback
  compatibleAnchors: Set<string>;
  
  // Connection callback
  onConnectionAttempt?: (anchor1: WorldAnchor, anchor2: WorldAnchor) => boolean;
}

export interface WirePlacementActions {
  activateMode: (onConnectionAttempt?: (anchor1: WorldAnchor, anchor2: WorldAnchor) => boolean) => void;
  deactivateMode: () => void;
  selectAnchor: (anchor: WorldAnchor) => void;
  hoverAnchor: (anchor: WorldAnchor | null) => void;
  clearSelection: () => void;
}

const initialState: WirePlacementState = {
  isActive: false,
  selectedAnchor: null,
  hoveredAnchor: null,
  compatibleAnchors: new Set(),
  onConnectionAttempt: undefined
};

/**
 * Wire placement store with Zustand
 */
export const useWirePlacementStore = create<WirePlacementState & WirePlacementActions>((set, get) => ({
  ...initialState,
  
  activateMode: (onConnectionAttempt) => {
    set({
      isActive: true,
      selectedAnchor: null,
      hoveredAnchor: null,
      compatibleAnchors: new Set(),
      onConnectionAttempt
    });
  },
  
  deactivateMode: () => {
    set({ ...initialState });
  },
  
  selectAnchor: (anchor) => {
    const state = get();
    
    if (!state.isActive) return;
    
    // If no selection, select this anchor
    if (!state.selectedAnchor) {
      set({
        selectedAnchor: anchor,
        compatibleAnchors: new Set()
      });
      return;
    }
    
    // If clicking the same anchor, deselect
    if (state.selectedAnchor.id === anchor.id) {
      set({
        selectedAnchor: null,
        compatibleAnchors: new Set()
      });
      return;
    }
    
    // Attempt to create connection
    if (state.onConnectionAttempt) {
      const success = state.onConnectionAttempt(state.selectedAnchor, anchor);
      
      if (success) {
        // Connection created, clear selection but stay in mode
        set({
          selectedAnchor: null,
          compatibleAnchors: new Set()
        });
      } else {
        // Connection failed, select the new anchor instead
        set({
          selectedAnchor: anchor,
          compatibleAnchors: new Set()
        });
      }
    } else {
      // No connection handler, just switch selection
      set({
        selectedAnchor: anchor,
        compatibleAnchors: new Set()
      });
    }
  },
  
  hoverAnchor: (anchor) => {
    set({ hoveredAnchor: anchor });
  },
  
  clearSelection: () => {
    set({
      selectedAnchor: null,
      hoveredAnchor: null,
      compatibleAnchors: new Set()
    });
  }
}));

// Convenience hooks
export const useWirePlacementState = () => {
  return useWirePlacementStore((state) => ({
    isActive: state.isActive,
    selectedAnchor: state.selectedAnchor,
    hoveredAnchor: state.hoveredAnchor,
    compatibleAnchors: state.compatibleAnchors,
    onConnectionAttempt: state.onConnectionAttempt
  }));
};

export const useWirePlacementActions = () => {
  return useWirePlacementStore((state) => ({
    activateMode: state.activateMode,
    deactivateMode: state.deactivateMode,
    selectAnchor: state.selectAnchor,
    hoverAnchor: state.hoverAnchor,
    clearSelection: state.clearSelection
  }));
};

/**
 * Check if two anchors can be connected
 */
export function areAnchorsCompatible(anchor1: WorldAnchor, anchor2: WorldAnchor): boolean {
  // Basic compatibility checks
  if (anchor1.id === anchor2.id) return false;
  
  // For now, allow all cross-anchor connections
  // TODO: Add voltage/current rating compatibility checks
  // TODO: Add part instance ID checks when available
  return true;
}

/**
 * Get visual state for an anchor during wire placement
 */
export function getAnchorVisualState(anchor: WorldAnchor, state: WirePlacementState): string {
  if (!state.isActive) return 'inactive';
  
  if (state.selectedAnchor?.id === anchor.id) return 'selected';
  if (state.hoveredAnchor?.id === anchor.id) {
    if (state.selectedAnchor && areAnchorsCompatible(state.selectedAnchor, anchor)) {
      return 'hovered-valid';
    }
    return 'hovered-invalid';
  }
  
  if (state.selectedAnchor) {
    if (areAnchorsCompatible(state.selectedAnchor, anchor)) {
      return 'compatible';
    }
    return 'incompatible';
  }
  
  return 'available';
}
