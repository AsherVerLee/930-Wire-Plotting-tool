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
  WireLabel,
} from "@/types/diagram";
import { canConnect } from "@/utils/validation";
import { kiCadRoute } from "@/utils/routing";
import type { WirePair } from "@/types/diagram";

interface SettingsState {
  gridSize: number;
  snapStrength: number; // 0..1
  router: {
    clearance: number;
    escapeLength: number;
    bendPenalty: number;
    nearObsPenalty: number;
    sameDirPenalty: number;
  };
  pair: {
    stripeSpacing: number; // px between stripes
    stripeThicknessScale: number; // multiplier on base width
    alwaysComposite: boolean;
  };
  validator: {
    autoCleanEnabled: boolean;
    validateOnMove: boolean;
    pairRepairOnMove: boolean;
  };
  visuals: {
    terminalRadius: number;
    labelFontSize: number;
    themeStrength: number; // 0..1
  };
  export: {
    dpi: number;
    pageSize: "A4" | "Letter" | "Tabloid";
    margin: number;
  };
}

import type { WirePair } from "@/types/diagram";

interface DiagramStoreState {
  partsLibrary: Record<string, PartDefinition>;
  components: PlacedComponent[];
  wires: WireSegmentPair[]; // legacy, for single wires (ethernet, usb)
  wirePairs: WirePair[]; // new: for paired wires (power, signal, CAN)
  labels: WireLabel[];
  selected: { type: "component" | "wire" | "wirePair"; id: string } | null;
  // viewport
  zoom: number;
  panX: number;
  panY: number;
  // connection state
  connectingFrom: TerminalRef | null;
  connectingPoints: { x: number; y: number }[]; // interactive, user-plotted points
  // history
  past: DiagramStateDto[];
  future: DiagramStateDto[];
  // preferences/settings
  settings: SettingsState;


  // settings update
  setSettings: (partial: Partial<SettingsState>) => void;
  setAutoCleanEnabled: (enabled: boolean) => void;
}


function snapshot(state: DiagramStoreState): DiagramStateDto {
  return {
    components: state.components.map((c) => ({ ...c })),
    wires: state.wires.map((w) => ({ ...w })),
    labels: state.labels.map((l) => ({ ...l })),
  };
}

const DEFAULT_SETTINGS: SettingsState = {
  gridSize: 16,
  snapStrength: 1,
  router: { clearance: 16, escapeLength: 32, bendPenalty: 0.8, nearObsPenalty: 0.05, sameDirPenalty: 4 },
  pair: { stripeSpacing: 6, stripeThicknessScale: 1.0, alwaysComposite: true },
  validator: { autoCleanEnabled: true, validateOnMove: true, pairRepairOnMove: true },
  visuals: { terminalRadius: 8, labelFontSize: 12, themeStrength: 1 },
  export: { dpi: 192, pageSize: "Letter", margin: 16 },
};

const GRID_FALLBACK = 16;
const snapTo = (n: number, grid: number) => Math.round(n / grid) * grid;
const snapPtWith = (p: {x:number;y:number}, grid: number) => ({ x: snapTo(p.x, grid), y: snapTo(p.y, grid) });

function linkOrth45(p: {x:number;y:number}, q: {x:number;y:number}, grid: number): {x:number;y:number}[] {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  if (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) {
    return [snapPtWith(q, grid)];
  }
  return [snapPtWith({ x: q.x, y: p.y }, grid), snapPtWith(q, grid)];
}

function simplifySeq(seq: {x:number;y:number}[]) {
  if (seq.length <= 2) return seq.slice();
  const out: {x:number;y:number}[] = [seq[0]];
  const isCollinear45 = (a: any, b: any, c: any) => {
    const abx = b.x - a.x, aby = b.y - a.y;
    const bcx = c.x - b.x, bcy = c.y - b.y;
    const dir = (dx: number, dy: number) => {
      if (dx === 0 && dy === 0) return "";
      if (dx === 0) return `v${Math.sign(dy)}`;
      if (dy === 0) return `h${Math.sign(dx)}`;
      if (Math.abs(dx) === Math.abs(dy)) return `d${Math.sign(dx)}${Math.sign(dy)}`;
      return "other";
    };
    const d1 = dir(abx, aby);
    const d2 = dir(bcx, bcy);
    return d1 !== "" && d1 === d2;
  };
  for (let i = 1; i < seq.length - 1; i++) {
    const a = out[out.length - 1];
    const b = seq[i];
    const c = seq[i + 1];
    if (isCollinear45(a, b, c)) continue;
    out.push(b);
  }
  out.push(seq[seq.length - 1]);
  return out;
}

function collapseLoops(seq: {x:number;y:number}[], grid = GRID_FALLBACK) {
  const out: {x:number;y:number}[] = [];
  const seen = new Map<string, number>();
  const key = (p: {x:number;y:number}) => `${p.x},${p.y}`;
  for (const p0 of seq) {
    const p = snapPtWith(p0, grid);
    const k = key(p);
    if (seen.has(k)) {
      const idx = seen.get(k)!;
      out.length = idx + 1;
      seen.clear();
      for (let i = 0; i < out.length; i++) seen.set(key(out[i]), i);
    } else {
      out.push(p);
      seen.set(k, out.length - 1);
    }
  }
  return out;
}

function rebuildStrict(seq: {x:number;y:number}[], grid = GRID_FALLBACK) {
  if (seq.length <= 1) return seq;
  const out: {x:number;y:number}[] = [snapPtWith(seq[0], grid)];
  for (let i = 1; i < seq.length; i++) {
    const added = linkOrth45(out[out.length - 1], seq[i], grid);
    for (const p of added) {
      const px = snapTo(p.x, grid), py = snapTo(p.y, grid);
      if (out[out.length - 1].x !== px || out[out.length - 1].y !== py) {
        out.push({ x: px, y: py });
      }
    }
  }
  return simplifySeq(out);
}

function removeSpikes(seq: {x:number;y:number}[], grid = GRID_FALLBACK): {x:number;y:number}[] {
  if (seq.length < 3) return seq;
  const out: {x:number;y:number}[] = [seq[0]];
  const dist = (p: any, q: any) => Math.hypot(p.x - q.x, p.y - q.y);
  const dirKey = (a: any, b: any) => {
    const dx = Math.sign(b.x - a.x);
    const dy = Math.sign(b.y - a.y);
    return `${dx},${dy}`;
  };
  for (let i = 1; i < seq.length - 1; i++) {
    const A = out[out.length - 1];
    const B = seq[i];
    const C = seq[i + 1];
    const d1 = dirKey(A, B);
    const d2 = dirKey(B, C);
    const opposite = (d1.split(',')[0] === String(-parseInt(d2.split(',')[0])) && d1.split(',')[1] === String(-parseInt(d2.split(',')[1])));
    const short = Math.min(dist(A, B), dist(B, C)) <= grid;
    if (opposite && short) {
      continue;
    }
    out.push(B);
  }
  out.push(seq[seq.length - 1]);
  return out;
}

function cleanWireUsingShape(w: WireSegmentPair, components: PlacedComponent[], lib: Record<string, PartDefinition>, grid = GRID_FALLBACK) {
  const getAbs = (ref: TerminalRef) => {
    const comp = components.find((c) => c.id === ref.componentId);
    if (!comp) return { x: 0, y: 0 };
    const part = lib[comp.partKey];
    const term = part?.terminals.find((t) => t.id === ref.terminalId);
    if (!term) return { x: comp.x, y: comp.y };
    return { x: comp.x + term.x, y: comp.y + term.y };
  };
  const a = getAbs(w.from);
  const b = getAbs(w.to);
  const seq0 = [a, ...(w.controlPoints ? w.controlPoints.map(p => snapPtWith(p, grid)) : []), b];
  const dedup: {x:number;y:number}[] = [];
  for (const p of seq0) {
    if (!dedup.length || dedup[dedup.length - 1].x !== p.x || dedup[dedup.length - 1].y !== p.y) dedup.push(p);
  }
  const noLoops = collapseLoops(dedup, grid);
  const deSpiked = removeSpikes(noLoops, grid);
  const simplified = simplifySeq(deSpiked);
  const strict = rebuildStrict(simplified, grid);
  const cps = strict.slice(1, strict.length - 1);
  return { ...w, controlPoints: cps } as WireSegmentPair;
}

function samePoints(a?: {x:number;y:number}[], b?: {x:number;y:number}[]) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i].x !== b[i].x || a[i].y !== b[i].y) return false;
  return true;
}

function pairGroup(t: TerminalType): "power" | "signal" | "can" | undefined {
  if (t === "power+" || t === "power-") return "power";
  if (t === "signal+" || t === "signal-") return "signal";
  if (t === "canH" || t === "canL") return "can";
  return undefined;
}
function complementType(t: TerminalType): TerminalType | undefined {
  switch (t) {
    case "power+": return "power-";
    case "power-": return "power+";
    case "signal+": return "signal-";
    case "signal-": return "signal+";
    case "canH": return "canL";
    case "canL": return "canH";
    default: return undefined;
  }
}
function isCanonicalType(t: TerminalType): boolean {
  return t === "power+" || t === "signal+" || t === "canH";
}
function pairKey(w: WireSegmentPair): string | undefined {
  const g = pairGroup(w.type);
  if (!g) return undefined;
  const a = w.from.componentId < w.to.componentId ? w.from.componentId : w.to.componentId;
  const b = w.from.componentId < w.to.componentId ? w.to.componentId : w.from.componentId;
  const net = w.netId ?? "";
  return `${g}|${a}|${b}|${net}`;
}

function syncPairedWires(wires: WireSegmentPair[]): WireSegmentPair[] {
  const groups = new Map<string, { canonical?: WireSegmentPair; partner?: WireSegmentPair }>();
  for (const w of wires) {
    const key = pairKey(w);
    if (!key) continue;
    const g = groups.get(key) ?? {};
    if (isCanonicalType(w.type) && !g.canonical) g.canonical = w; else if (!g.partner) g.partner = w;
    groups.set(key, g);
  }
  const byId = new Map(wires.map((w) => [w.id, w] as const));
  for (const [, g] of groups) {
    if (!g.canonical || !g.partner) continue;
    const c = g.canonical;
    const p = g.partner;
    const sameDir = c.from.componentId === p.from.componentId && c.to.componentId === p.to.componentId;
    const cps = (c.controlPoints ?? []).map((pt) => ({ ...pt }));
    const newCps = sameDir ? cps.map((p) => ({ ...p })) : cps.slice().reverse().map((p) => ({ ...p }));
    const existing = byId.get(p.id)!;
    if (!samePoints(existing.controlPoints, newCps)) {
      byId.set(p.id, { ...existing, controlPoints: newCps });
    }
  }
  return Array.from(byId.values());
}

export const useDiagramStore = create<DiagramStoreState>((set, get) => ({
  setWireControlPoints: (id, updater) =>
    set((state) => {
      const next = snapshot(state);
      const comps = state.components;
      const lib = state.partsLibrary;
      const grid = state.settings.gridSize || GRID_FALLBACK;
      let updatedWire: WireSegmentPair | undefined;
      let wires = state.wires.map((w) => {
        if (w.id !== id) return w;
        const prev = w.controlPoints;
        const nextPts = updater(prev);
        updatedWire = cleanWireUsingShape({ ...w, controlPoints: nextPts }, comps, lib, grid);
        return updatedWire;
      });
      wires = syncPairedWires(wires);
      return {
        ...state,
        wires,
        past: [...state.past, next],
        future: [],
      };
    }),
  partsLibrary: {},
  components: [],
  wires: [],
  labels: [],
  selected: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  connectingFrom: null,
  connectingPoints: [],
  past: [],
  future: [],
  settings: DEFAULT_SETTINGS,

  setSettings: (partial) => set((state) => ({ settings: { ...state.settings, ...partial, router: { ...state.settings.router, ...(partial as any).router }, pair: { ...state.settings.pair, ...(partial as any).pair }, validator: { ...state.settings.validator, ...(partial as any).validator }, visuals: { ...state.settings.visuals, ...(partial as any).visuals }, export: { ...state.settings.export, ...(partial as any).export } } })),

  setPartsLibrary: (parts) => {
    const validParts = parts.filter((p) => {
      if (!p.key || typeof p.key !== "string" || p.key.trim() === "") {
        console.warn("Part missing key and will be skipped:", p);
        return false;
      }
      return true;
    });
    set(() => ({
      partsLibrary: Object.fromEntries(validParts.map((p) => [p.key, p])),
    }));
  },

  addPartDefinition: (part) => set((state) => ({
    partsLibrary: { ...state.partsLibrary, [part.key]: part },
  })),

  addComponent: (partKey, x, y) =>
    set((state) => {
      const part = state.partsLibrary[partKey];
      if (!part) {
        console.error("Part not found for key:", partKey);
        return state;
      }
      const next: DiagramStateDto = snapshot(state);
      const grid = state.settings.gridSize || GRID_FALLBACK;
      const comp: PlacedComponent = {
        id: nanoid(),
        partKey,
        name: part.name,
        x: snapTo(x, grid),
        y: snapTo(y, grid),
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
    set((state) => {
      const grid = state.settings.gridSize || GRID_FALLBACK;
      const settings = state.settings;
      const components = state.components.map((c) => (c.id === id ? { ...c, x, y } : c));
      const lib = state.partsLibrary;

      const getAbs = (ref: TerminalRef) => {
        const comp = components.find((c) => c.id === ref.componentId);
        if (!comp) return { x: 0, y: 0 };
        const part = lib[comp.partKey];
        const term = part?.terminals.find((t) => t.id === ref.terminalId);
        if (!term) return { x: comp.x, y: comp.y };
        return { x: comp.x + term.x, y: comp.y + term.y };
      };

      const obstacles = components.map((c) => {
        const def = lib[c.partKey];
        return { x: c.x, y: c.y, width: def?.width ?? 0, height: def?.height ?? 0 };
      });

      const hvSegments = state.wires
        .filter(w => w.from.componentId !== id && w.to.componentId !== id)
        .flatMap(w => {
          const a = getAbs(w.from);
          const b = getAbs(w.to);
          const pts = [a, ...(w.controlPoints ?? []), b];
          const segs: {x1:number;y1:number;x2:number;y2:number}[] = [];
          for (let i=1;i<pts.length;i++) {
            const p = pts[i-1], q = pts[i];
            if (p.x === q.x || p.y === q.y) segs.push({ x1: p.x, y1: p.y, x2: q.x, y2: q.y });
          }
          return segs;
        });

      const routeWire = (w: WireSegmentPair): WireSegmentPair => {
        if (!settings.validator.validateOnMove) return w;
        if (w.from.componentId !== id && w.to.componentId !== id) return w;
        const a = getAbs(w.from);
        const b = getAbs(w.to);
        try {
          const d = kiCadRoute(a, b, obstacles, {
            gridSize: grid,
            clearance: settings.router.clearance,
            escape: settings.router.escapeLength,
            existingSegments: hvSegments,
            bendPenalty: settings.router.bendPenalty,
            nearObsPenalty: settings.router.nearObsPenalty,
            sameDirPenalty: settings.router.sameDirPenalty,
          } as any);
          const pts = Array.from(d.matchAll(/([ML])\s*(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)).map((m) => ({ x: snapTo(parseFloat(m[2]), grid), y: snapTo(parseFloat(m[3]), grid) }));
          const cps = pts.slice(1, pts.length - 1);
          return { ...w, controlPoints: cps };
        } catch {
          return cleanWireUsingShape(w, components, lib, grid);
        }
      };

      let wires = state.wires.map(routeWire);
      if (settings.validator.pairRepairOnMove) wires = syncPairedWires(wires);
      wires = wires.map(w => w.controlPoints ? { ...w, controlPoints: w.controlPoints.map(p => snapPtWith(p, grid)) } : w);
      return { ...state, components, wires };
    }),

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

  renameComponent: (id, name) =>
    set((state) => {
      const next = snapshot(state);
      return {
        ...state,
        components: state.components.map((c) => (c.id === id ? { ...c, name } : c)),
        past: [...state.past, next],
        future: [],
      };
    }),

  select: (sel) => set(() => ({ selected: sel })),

  setZoom: (zoom) => set(() => ({ zoom })),
  setPan: (x, y) => set(() => ({ panX: x, panY: y })),

  startConnection: (ref) => set(() => ({ connectingFrom: ref, connectingPoints: [] })),

  addConnectingPoint: (pt) => set((state) => ({ connectingPoints: [...state.connectingPoints, pt] })),
  popConnectingPoint: () => set((state) => ({ connectingPoints: state.connectingPoints.slice(0, -1) })),
  clearConnectingPath: () => set(() => ({ connectingPoints: [] })),

  completeConnection: (ref, options) =>
    set((state) => {
      if (!state.connectingFrom) return state;
      const grid = state.settings.gridSize || GRID_FALLBACK;
      const from = state.connectingFrom;
      const getType = (t: TerminalRef): TerminalType | null => {
        const comp = state.components.find((c) => c.id === t.componentId);
        if (!comp) return null;
        const part = state.partsLibrary[comp.partKey];
        const term = part?.terminals.find((tm) => tm.id === t.terminalId);
        return term?.type ?? null;
      };
      const a = getType(from);
      const b = getType(ref);
      if (!a || !b) return { ...state, connectingFrom: null, connectingPoints: [] };
      if (!canConnect(a, b)) {
        return { ...state, connectingFrom: null, connectingPoints: [] };
      }
      const next = snapshot(state);
      const comps = state.components;
      const lib = state.partsLibrary;
      // Determine if this is a paired type
      const pairedTypes: Record<string, [TerminalType, TerminalType]> = {
        "power+": ["power+", "power-"],
        "power-": ["power+", "power-"],
        "signal+": ["signal+", "signal-"],
        "signal-": ["signal+", "signal-"],
        "canH": ["canH", "canL"],
        "canL": ["canH", "canL"],
      };
      if (pairedTypes[a]) {
        // Create a WirePair
        const pairId = nanoid();
        const controlPoints = state.connectingPoints.map((p) => ({ x: snapTo(p.x, grid), y: snapTo(p.y, grid) }));
        const wirePair = {
          id: pairId,
          from,
          to: ref,
          types: pairedTypes[a],
          gauge: options?.gauge ?? 18,
          netId: options?.netId,
          controlPoints,
        };
        return {
          ...state,
          wirePairs: [...(state.wirePairs || []), wirePair],
          connectingFrom: null,
          connectingPoints: [],
          past: [...state.past, next],
          future: [],
          selected: { type: "wirePair", id: pairId },
        };
      } else {
        // Single wire (ethernet, usb, etc)
        const tempWire: WireSegmentPair = {
          id: "temp",
          from,
          to: ref,
          type: a,
          gauge: options?.gauge ?? 18,
          netId: options?.netId,
          controlPoints: state.connectingPoints.map((p) => ({ x: snapTo(p.x, grid), y: snapTo(p.y, grid) })),
        };
        const cleaned = cleanWireUsingShape(tempWire, comps, lib, grid);
        const wire: WireSegmentPair = {
          id: nanoid(),
          from,
          to: ref,
          type: a,
          gauge: options?.gauge ?? 18,
          netId: options?.netId,
          controlPoints: cleaned.controlPoints,
        };
        return {
          ...state,
          wires: syncPairedWires([...state.wires, wire]),
          connectingFrom: null,
          connectingPoints: [],
          past: [...state.past, next],
          future: [],
          selected: { type: "wire", id: wire.id },
        };
      }
    }),

  cancelConnection: () => set(() => ({ connectingFrom: null, connectingPoints: [] })),

  setWireGauge: (id, gauge) =>
    set((state) => {
      const next = snapshot(state);
      return {
        ...state,
        wires: syncPairedWires(state.wires.map((w) => {
          if (w.type === 'ethernet' || w.type === 'usb') return w;
          return (w.id === id ? { ...w, gauge } : w);
        })),
        past: [...state.past, next],
        future: [],
      };
    }),

  addWireLabel: (wireId, text) => set((state) => ({
    labels: [...state.labels, { id: nanoid(), wireId, text: text ?? "Label" }],
  })),
  updateWireLabel: (labelId, text) => set((state) => ({
    labels: state.labels.map(l => l.id === labelId ? { ...l, text } : l),
  })),
  removeWireLabel: (labelId) => set((state) => ({
    labels: state.labels.filter(l => l.id !== labelId),
  })),

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

  removeComponent: (id) =>
    set((state) => {
      const next = snapshot(state);
      return {
        ...state,
        components: state.components.filter((c) => c.id !== id),
        wires: state.wires.filter((w) => w.from.componentId !== id && w.to.componentId !== id),
        selected: state.selected && state.selected.type === 'component' && state.selected.id === id ? null : state.selected,
        past: [...state.past, next],
        future: [],
      };
    }),

  saveDto: () => snapshot(get()),

  loadDto: (dto) =>
    set((state) => ({
      components: dto.components,
      wires: dto.wires,
      labels: dto.labels ?? [],
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

  snapAllToGrid: () =>
    set((state) => {
      const next = snapshot(state);
      const grid = state.settings.gridSize || GRID_FALLBACK;
      const components = state.components.map((c) => ({ ...c, x: snapTo(c.x, grid), y: snapTo(c.y, grid) }));
      let wires = state.wires.map((w) => w.controlPoints ? { ...w, controlPoints: w.controlPoints.map(p => snapPtWith(p, grid)) } : w);
      wires = syncPairedWires(wires);
      return {
        ...state,
        components,
        wires,
        past: [...state.past, next],
        future: [],
      };
    }),

  cleanWires: () =>
    set((state) => {
      const next = snapshot(state);
      const comps = state.components;
      const lib = state.partsLibrary;
      const grid = state.settings.gridSize || GRID_FALLBACK;
      let wires = state.wires.map((w) => cleanWireUsingShape(w, comps, lib, grid));
      wires = syncPairedWires(wires);
      wires = wires.map(w => w.controlPoints ? { ...w, controlPoints: w.controlPoints.map(p => snapPtWith(p, grid)) } : w);
      return {
        ...state,
        wires,
        past: [...state.past, next],
        future: [],
      };
    }),

  repairPairSpacing: () =>
    set((state) => {
      const next = snapshot(state);
      const comps = state.components;
      const lib = state.partsLibrary;
      const grid = state.settings.gridSize || GRID_FALLBACK;
      let wires = state.wires.map((w) => cleanWireUsingShape(w, comps, lib, grid));
      wires = syncPairedWires(wires);
      wires = wires.map(w => w.controlPoints ? { ...w, controlPoints: w.controlPoints.map(p => snapPtWith(p, grid)) } : w);
      return { ...state, wires, past: [...state.past, next], future: [] };
    }),

  validateWires: () =>
    set((state) => {
      if (!state.settings.validator.autoCleanEnabled) return state;
      const comps = state.components;
      const lib = state.partsLibrary;
      const grid = state.settings.gridSize || GRID_FALLBACK;
      let changed = false;
      let wires = state.wires.map((w) => {
        const cleaned = cleanWireUsingShape(w, comps, lib, grid);
        if (!samePoints(cleaned.controlPoints, w.controlPoints)) changed = true;
        return cleaned;
      });
      let synced = syncPairedWires(wires);
      if (synced.length !== wires.length) changed = true; else {
        for (let i = 0; i < wires.length; i++) if (!samePoints(wires[i].controlPoints, synced[i].controlPoints)) { changed = true; break; }
      }
      if (!changed) return state;
      synced = synced.map(w => w.controlPoints ? { ...w, controlPoints: w.controlPoints.map(p => snapPtWith(p, grid)) } : w);
      return { ...state, wires: synced };
    }),

  setAutoCleanEnabled: (enabled) => set((state) => ({ settings: { ...state.settings, validator: { ...state.settings.validator, autoCleanEnabled: enabled } } })),
}));
