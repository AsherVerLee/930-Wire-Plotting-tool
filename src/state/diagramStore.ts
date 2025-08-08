import { create } from "zustand";
import { nanoid } from "nanoid";
import type {
  DiagramStateDto,
  PlacedComponent,
  WireSegmentPair,
  PartDefinition,
  TerminalRef,
  TerminalType,
  Gauge,
} from "@/types/diagram";
import { canConnect } from "@/utils/validation";

interface DiagramStoreState {
  partsLibrary: Record<string, PartDefinition>;
  components: PlacedComponent[];
  wires: WireSegmentPair[];
  selected: { type: "component" | "wire"; id: string } | null;
  // viewport
  zoom: number;
  panX: number;
  panY: number;
  // connection state
  connectingFrom: TerminalRef | null;
  // history
  past: DiagramStateDto[];
  future: DiagramStateDto[];

  // actions
  setPartsLibrary: (parts: PartDefinition[]) => void;
  addComponent: (partKey: string, x: number, y: number) => void;
  moveComponent: (id: string, x: number, y: number) => void;
  rotateComponent: (id: string, rotation: 0 | 90 | 180 | 270) => void;
  select: (sel: DiagramStoreState["selected"]) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  startConnection: (ref: TerminalRef) => void;
  completeConnection: (ref: TerminalRef, options?: { gauge?: Gauge; netId?: string }) => void;
  cancelConnection: () => void;
  setWireGauge: (id: string, gauge: Gauge) => void;
  removeSelected: () => void;
  saveDto: () => DiagramStateDto;
  loadDto: (dto: DiagramStateDto) => void;
  undo: () => void;
  redo: () => void;
}

function snapshot(state: DiagramStoreState): DiagramStateDto {
  return {
    components: state.components.map((c) => ({ ...c })),
    wires: state.wires.map((w) => ({ ...w })),
  };
}

export const useDiagramStore = create<DiagramStoreState>((set, get) => ({
  partsLibrary: {},
  components: [],
  wires: [],
  selected: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  connectingFrom: null,
  past: [],
  future: [],

  setPartsLibrary: (parts) =>
    set(() => ({
      partsLibrary: Object.fromEntries(parts.map((p) => [p.key, p])),
    })),

  addComponent: (partKey, x, y) =>
    set((state) => {
      const part = state.partsLibrary[partKey];
      if (!part) return state;
      const next: DiagramStateDto = snapshot(state);
      const comp: PlacedComponent = {
        id: nanoid(),
        partKey,
        name: part.name,
        x,
        y,
        rotation: 0,
      };
      return {
        ...state,
        components: [...state.components, comp],
        past: [...state.past, next],
        future: [],
        selected: { type: "component", id: comp.id },
      };
    }),

  moveComponent: (id, x, y) =>
    set((state) => ({
      components: state.components.map((c) => (c.id === id ? { ...c, x, y } : c)),
    })),

  rotateComponent: (id, rotation) =>
    set((state) => {
      const next = snapshot(state);
      return {
        ...state,
        components: state.components.map((c) => (c.id === id ? { ...c, rotation } : c)),
        past: [...state.past, next],
        future: [],
      };
    }),

  select: (sel) => set(() => ({ selected: sel })),

  setZoom: (zoom) => set(() => ({ zoom })),
  setPan: (x, y) => set(() => ({ panX: x, panY: y })),

  startConnection: (ref) => set(() => ({ connectingFrom: ref })),

  completeConnection: (ref, options) =>
    set((state) => {
      if (!state.connectingFrom) return state;
      const from = state.connectingFrom;
      // resolve terminal types
      const getType = (t: TerminalRef): TerminalType | null => {
        const comp = state.components.find((c) => c.id === t.componentId);
        if (!comp) return null;
        const part = state.partsLibrary[comp.partKey];
        const term = part?.terminals.find((tm) => tm.id === t.terminalId);
        return term?.type ?? null;
      };
      const a = getType(from);
      const b = getType(ref);
      if (!a || !b) return { ...state, connectingFrom: null };
      if (!canConnect(a, b)) {
        return { ...state, connectingFrom: null };
      }
      const next = snapshot(state);
      const wire: WireSegmentPair = {
        id: nanoid(),
        from,
        to: ref,
        type: a, // assume matching by validation
        gauge: options?.gauge ?? 18,
        netId: options?.netId,
      };
      return {
        ...state,
        wires: [...state.wires, wire],
        connectingFrom: null,
        past: [...state.past, next],
        future: [],
        selected: { type: "wire", id: wire.id },
      };
    }),

  cancelConnection: () => set(() => ({ connectingFrom: null })),

  setWireGauge: (id, gauge) =>
    set((state) => {
      const next = snapshot(state);
      return {
        ...state,
        wires: state.wires.map((w) => (w.id === id ? { ...w, gauge } : w)),
        past: [...state.past, next],
        future: [],
      };
    }),

  removeSelected: () =>
    set((state) => {
      if (!state.selected) return state;
      const next = snapshot(state);
      if (state.selected.type === "component") {
        const id = state.selected.id;
        return {
          ...state,
          components: state.components.filter((c) => c.id !== id),
          wires: state.wires.filter(
            (w) => w.from.componentId !== id && w.to.componentId !== id
          ),
          selected: null,
          past: [...state.past, next],
          future: [],
        };
      } else {
        const id = state.selected.id;
        return {
          ...state,
          wires: state.wires.filter((w) => w.id !== id),
          selected: null,
          past: [...state.past, next],
          future: [],
        };
      }
    }),

  saveDto: () => snapshot(get()),

  loadDto: (dto) =>
    set((state) => ({
      components: dto.components,
      wires: dto.wires,
      selected: null,
      past: [...state.past, snapshot(state)],
      future: [],
    })),

  undo: () =>
    set((state) => {
      const prev = state.past[state.past.length - 1];
      if (!prev) return state;
      const newPast = state.past.slice(0, -1);
      const future = [snapshot(state), ...state.future];
      return {
        ...state,
        components: prev.components,
        wires: prev.wires,
        past: newPast,
        future,
        selected: null,
      };
    }),

  redo: () =>
    set((state) => {
      const next = state.future[0];
      if (!next) return state;
      const newFuture = state.future.slice(1);
      return {
        ...state,
        components: next.components,
        wires: next.wires,
        past: [...state.past, snapshot(state)],
        future: newFuture,
        selected: null,
      };
    }),
}));
