import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useDrop, useDrag } from "react-dnd";
import { useDiagramStore } from "@/state/diagramStore";
import { useWireModeActions } from "@/state/wireModeStore";
import partsJson from "../parts/library930.json";
import { loadCustomParts } from "../parts/customParts";
import type { PartDefinition, Terminal } from "@/types/diagram";
import { terminalColors } from "@/types/diagram";
import { strokeWidthForGauge, offsetForPair, pathToSVG } from "@/utils/routing";
import { canConnect } from "@/utils/validation";
import { TerminalComponent, WireModeIndicator } from "./TerminalComponent";
import { WireModeToolbar } from "./WireModeToolbar";
import { toast } from "sonner";

const GRID = 16;

function snap(n: number) {
  return Math.round(n / GRID) * GRID;
}

// Snap delta to nearest 0/45/90 direction and return absolute point from prev
function snapToEightFrom(prev: {x:number;y:number}, target: {x:number;y:number}) {
  const dx = target.x - prev.x;
  const dy = target.y - prev.y;
  if (dx === 0 && dy === 0) return { x: snap(prev.x), y: snap(prev.y) };
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const snappedAngle = Math.round(angle / 45) * 45;
  const rad = snappedAngle * Math.PI / 180;
  const sgn = (v: number) => (v === 0 ? 0 : v > 0 ? 1 : -1);
  // Choose step length snapped to grid
  const step = snap(Math.max(Math.abs(dx), Math.abs(dy)));
  const dirX = Math.cos(rad), dirY = Math.sin(rad);
  // For pure cardinal moves, keep exact axis; for diagonals, move both axes equally
  let nx = prev.x, ny = prev.y;
  if (Math.abs(Math.round(dirX)) === 1 && Math.abs(Math.round(dirY)) === 0) {
    nx = snap(prev.x + step * sgn(dx)); ny = prev.y;
  } else if (Math.abs(Math.round(dirY)) === 1 && Math.abs(Math.round(dirX)) === 0) {
    nx = prev.x; ny = snap(prev.y + step * sgn(dy));
  } else {
    // diagonal 45°: step equally in x and y
    const s = step;
    nx = snap(prev.x + s * sgn(dx));
    ny = snap(prev.y + s * sgn(dy));
  }
  return { x: nx, y: ny };
}

export const DiagramCanvas = ({ paletteVisible = true }: { paletteVisible?: boolean }) => {
  const ref = useRef<SVGSVGElement | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  
  // Store hooks
  const { 
    components, 
    wires, 
    wirePairs, 
    zoom, 
    panX, 
    panY, 
    setZoom, 
    setPan, 
    addComponent, 
    setPartsLibrary, 
    select, 
    partsLibrary, 
    moveComponent, 
    removeComponent,
    createAutomaticConnection,
    autoRouteAllWires
  } = useDiagramStore();
  
  const { labels, addWireLabel } = useDiagramStore((s) => ({ 
    labels: (s as any).labels, 
    addWireLabel: (s as any).addWireLabel 
  }));

  // Wire mode hooks
  const wireModeActions = useWireModeActions();

  // Debug: log partsLibrary and components on every render
  useEffect(() => {
    console.log("[DEBUG] partsLibrary keys:", Object.keys(partsLibrary));
    console.log("[DEBUG] components:", components);
  });

  // Initialize library in store once
  useEffect(() => {
    const custom = loadCustomParts();
    const allParts = [...(partsJson as PartDefinition[]), ...custom];
    setPartsLibrary(allParts);
  }, [setPartsLibrary]);

  const [, drop] = useDrop(
    () => ({
      accept: ["PART", "COMPONENT"],
      drop: (item: { key?: string; componentId?: string }, monitor) => {
        try {
          const client = monitor.getClientOffset();
          if (!client) return;

          if (!item.key && !item.componentId) return;

          const canvasRect = ref.current?.getBoundingClientRect();
          if (!canvasRect) return;

          const relativeX = client.x - canvasRect.left;
          const relativeY = client.y - canvasRect.top;

          // Removed palette area check; SVG coords are already relative to canvas

          if (item.key) {
            const partDef = partsLibrary[item.key];
            if (!partDef) return;
            const x = snap((relativeX - panX) / zoom);
            const y = snap((relativeY - panY) / zoom);
            addComponent(item.key, x, y);
            toast.success("Component placed!");
          }
        } catch (err) {
          console.error("Drop handler error:", err);
          toast.error("Failed to place component.");
        }
      },
    }),
    [zoom, panX, panY, addComponent, removeComponent, partsLibrary, paletteVisible]
  );

  drop(ref);

  const onWheel: React.WheelEventHandler<SVGSVGElement> = (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.96 : 1.04; // even slower zoom
    const newZoom = Math.min(3, Math.max(0.2, zoom * factor));
    // zoom to cursor: adjust pan so the point under cursor stays fixed
    const svg = ref.current;
    if (!svg) return setZoom(newZoom);
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return setZoom(newZoom);
    const cursor = pt.matrixTransform(ctm.inverse());
    const wx = (cursor.x - panX) / zoom;
    const wy = (cursor.y - panY) / zoom;
    const newPanX = cursor.x - wx * newZoom;
    const newPanY = cursor.y - wy * newZoom;
    setPan(newPanX, newPanY);
    setZoom(newZoom);
  };

  const onMouseDown: React.MouseEventHandler<SVGSVGElement> = (e) => {
    if (e.button === 1 || e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  };
  const onMouseMove: React.MouseEventHandler<SVGSVGElement> = (e) => {
    if (isPanning && panStart) {
      setPan(e.clientX - panStart.x, e.clientY - panStart.y);
    }
  };
  const onMouseUp: React.MouseEventHandler<SVGSVGElement> = () => {
    setIsPanning(false);
    setPanStart(null);
  };

  const getTerminalAbs = (compId: string, term: Terminal) => {
    const comp = components.find((c) => c.id === compId);
    if (!comp) return { x: 0, y: 0 };
    // rotation not applied to terminals in this v1 for simplicity
    return { x: comp.x + term.x, y: comp.y + term.y };
  };

  // Handle automatic wire connections
  const handleConnectionComplete = (from: any, to: any) => {
    createAutomaticConnection(from, to);
    toast.success("Wire connected automatically!");
  };

  // Component dragging with automatic wire rerouting
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

  // Component dragging with better offset handling
  const onPartMouseDown = (id: string, e: React.MouseEvent) => {
    if (e.button !== 0) return; // left only
    if (connectingFrom) return; // don't drag parts while routing
    
    // Calculate offset from mouse to component origin to maintain relative position
    const comp = components.find(c => c.id === id);
    if (!comp) return;
    
    const svg = ref.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const mouse = pt.matrixTransform(ctm.inverse());
    const worldMouse = { x: (mouse.x - panX) / zoom, y: (mouse.y - panY) / zoom };
    
    setDragId(id);
    setDragOffset({ x: worldMouse.x - comp.x, y: worldMouse.y - comp.y });
    select({ type: "component", id });
  };

  const updatePreviewFromEvent = (e: React.MouseEvent) => {
    const svg = ref.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const cursor = pt.matrixTransform(ctm.inverse());
    const worldMouse = { x: (cursor.x - panX) / zoom, y: (cursor.y - panY) / zoom };

    if (connectingFrom) {
      // Build anchor chain: start terminal -> existing points
      const startComp = components.find(c => c.id === connectingFrom.componentId);
      const startTerm = startComp && partsLibrary[startComp.partKey]?.terminals.find(t => t.id === connectingFrom.terminalId);
      if (!startComp || !startTerm) return;
      const start = { x: startComp.x + startTerm.x, y: startComp.y + startTerm.y };
      const last = connectingPoints.length ? connectingPoints[connectingPoints.length - 1] : start;
      const snapped = snapToEightFrom(last, worldMouse);
      setPreviewMouse(snapped);
    }
  };

  const onSvgMouseMove: React.MouseEventHandler<SVGSVGElement> = (e) => {
    onMouseMove(e);
    // continuous wire validator to keep pairs tidy automatically
    useDiagramStore.getState().validateWires();
    if (connectingFrom) {
      updatePreviewFromEvent(e);
      return; // don't move parts while routing
    }
    if (dragId && ref.current && dragOffset) {
      const svg = ref.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const cursor = pt.matrixTransform(ctm.inverse());
      const worldMouse = { x: (cursor.x - panX) / zoom, y: (cursor.y - panY) / zoom };
      const x = snap(worldMouse.x - dragOffset.x);
      const y = snap(worldMouse.y - dragOffset.y);
      moveComponent(dragId, x, y);
    }
  };

  const onSvgMouseUp: React.MouseEventHandler<SVGSVGElement> = (e) => {
    onMouseUp(e);
    if (connectingFrom) return;
    setDragId(null);
    setDragOffset(null);
  };

  const onSvgClick: React.MouseEventHandler<SVGSVGElement> = (e) => {
    if (!connectingFrom) return;
    // Allow clicking anywhere (not just background) to add a waypoint while routing
    updatePreviewFromEvent(e);
    if (!previewMouse) return;
    addConnectingPoint({ x: previewMouse.x, y: previewMouse.y });
  };

  const addWaypointFromEvent = (e: React.MouseEvent) => {
    if (!connectingFrom) return;
    const svg = ref.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const cursor = pt.matrixTransform(ctm.inverse());
    const worldMouse = { x: (cursor.x - panX) / zoom, y: (cursor.y - panY) / zoom };
    const startComp = components.find(c => c.id === connectingFrom.componentId);
    const startTerm = startComp && partsLibrary[startComp.partKey]?.terminals.find(t => t.id === connectingFrom.terminalId);
    if (!startComp || !startTerm) return;
    const start = { x: startComp.x + startTerm.x, y: startComp.y + startTerm.y };
    const last = connectingPoints.length ? connectingPoints[connectingPoints.length - 1] : start;
    const snapped = snapToEightFrom(last, worldMouse);
    addConnectingPoint(snapped);
  };

  const onKeyDown: React.KeyboardEventHandler<SVGSVGElement> = (e) => {
    if (!connectingFrom) return;
    if ((e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      popConnectingPoint();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelConnection();
      setPreviewMouse(null);
    }
  };

  // Build preview path when routing
  const previewPath = useMemo(() => {
    if (!connectingFrom) return null;
    const startComp = components.find(c => c.id === connectingFrom.componentId);
    const startTerm = startComp && partsLibrary[startComp.partKey]?.terminals.find(t => t.id === connectingFrom.terminalId);
    if (!startComp || !startTerm) return null;
    const start = { x: startComp.x + startTerm.x, y: startComp.y + startTerm.y };
    const pts = [start, ...connectingPoints];
    const last = pts[pts.length - 1];
    const tail = previewMouse ?? last;
    const pathPts = tail === last ? pts : [...pts, tail];
    let d = `M ${pathPts[0].x},${pathPts[0].y}`;
    for (let i = 1; i < pathPts.length; i++) {
      d += ` L ${pathPts[i].x},${pathPts[i].y}`;
    }
    return d;
  }, [connectingFrom, components, partsLibrary, connectingPoints, previewMouse]);

  // helpers for pair rendering
  const isCanonicalType = (t: Terminal["type"]) => t === "power+" || t === "signal+" || t === "canH";
  const complementType = (t: Terminal["type"]) => {
    switch (t) {
      case "power+": return "power-";
      case "power-": return "power+";
      case "signal+": return "signal-";
      case "signal-": return "signal+";
      case "canH": return "canL";
      case "canL": return "canH";
      default: return undefined;
    }
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] bg-background/40 rounded-lg border border-border overflow-hidden">
      <svg
        ref={ref}
        className="w-full h-full touch-none select-none"
        data-canvas="true"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onSvgMouseMove}
        onMouseUp={onSvgMouseUp}
        onClick={onSvgClick}
        onKeyDown={onKeyDown}
        tabIndex={0}
      >
        {/* grid pattern */}
        <defs>
          <pattern id="grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
            <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* world */}
        <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
          {/* grid aligned with world (snapping) */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* paired wires */}
          {wirePairs.map((pair) => {
            // Render both wires in the pair, offset from the centerline
            const aComp = components.find((c) => c.id === pair.from.componentId);
            const bComp = components.find((c) => c.id === pair.to.componentId);
            if (!aComp || !bComp) return null;
            const aTerm = (partsLibrary[aComp.partKey]?.terminals || []).find((t) => t.id === pair.from.terminalId);
            const bTerm = (partsLibrary[bComp.partKey]?.terminals || []).find((t) => t.id === pair.to.terminalId);
            if (!aTerm || !bTerm) return null;
            const a = getTerminalAbs(aComp.id, aTerm);
            const b = getTerminalAbs(bComp.id, bTerm);

            // Use centerline path from controlPoints, or straight line if none
            const pts = [a, ...(pair.controlPoints ?? []), b];
            let d = `M ${pts[0].x},${pts[0].y}`;
            for (let i = 1; i < pts.length; i++) {
              d += ` L ${pts[i].x},${pts[i].y}`;
            }

            // Offset both wires from centerline
            const offset = 8; // px, can be made grid-aligned
            function offsetPath(path, offsetDir) {
              // Simple offset: for each segment, offset perpendicular by offsetDir*offset
              const segs = pts.map(p => ({ ...p }));
              const out = [];
              for (let i = 1; i < segs.length; i++) {
                const a = segs[i - 1], b = segs[i];
                let dx = b.x - a.x, dy = b.y - a.y;
                const len = Math.hypot(dx, dy) || 1;
                // Perpendicular direction
                const px = -dy / len * offset * offsetDir;
                const py = dx / len * offset * offsetDir;
                if (i === 1) out.push({ x: a.x + px, y: a.y + py });
                out.push({ x: b.x + px, y: b.y + py });
              }
              let d2 = `M ${out[0].x},${out[0].y}`;
              for (let i = 1; i < out.length; i++) d2 += ` L ${out[i].x},${out[i].y}`;
              return d2;
            }

            // Colors for each type
            const colorA = terminalColors[pair.types[0]];
            const colorB = terminalColors[pair.types[1]];
            const width = 4;

            return (
              <g key={pair.id}>
                <path d={offsetPath(d, -1)} fill="none" stroke={colorA} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
                <path d={offsetPath(d, 1)} fill="none" stroke={colorB} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
                {/* Wide transparent hit area for selection */}
                <path d={d} fill="none" stroke="transparent" strokeWidth={width + 12} pointerEvents="stroke" style={{ cursor: "pointer" }} />
              </g>
            );
          })}
          {/* single wires (ethernet, usb) */}
          {wires.map((w) => {
            try {
              const aComp = components.find((c) => c.id === w.from.componentId);
              const bComp = components.find((c) => c.id === w.to.componentId);
              if (!aComp || !bComp) return null;
              const aTerm = (partsLibrary[aComp.partKey]?.terminals || []).find((t) => t.id === w.from.terminalId);
              const bTerm = (partsLibrary[bComp.partKey]?.terminals || []).find((t) => t.id === w.to.terminalId);
              if (!aTerm || !bTerm) return null;
              const a = getTerminalAbs(aComp.id, aTerm);
              const b = getTerminalAbs(bComp.id, bTerm);

              // --- Paired wire logic ---
              const isPairedType = (t) => (
                t === "power+" || t === "power-" || t === "signal+" || t === "signal-" || t === "canH" || t === "canL"
              );
              const isCanonicalType = (t) => t === "power+" || t === "signal+" || t === "canH";
              const complementType = (t) => {
                switch (t) {
                  case "power+": return "power-";
                  case "power-": return "power+";
                  case "signal+": return "signal-";
                  case "signal-": return "signal+";
                  case "canH": return "canL";
                  case "canL": return "canH";
                  default: return undefined;
                }
              };
              // Pair key logic (matches diagramStore)
              const pairGroup = (t) => {
                if (t.startsWith("power")) return "power";
                if (t.startsWith("signal")) return "signal";
                if (t.startsWith("can")) return "can";
                return undefined;
              };
              const pairKey = (w) => {
                const g = pairGroup(w.type);
                if (!g) return undefined;
                const a = w.from.componentId < w.to.componentId ? w.from.componentId : w.to.componentId;
                const b = w.from.componentId < w.to.componentId ? w.to.componentId : w.from.componentId;
                const net = w.netId ?? "";
                return `${g}|${a}|${b}|${net}`;
              };
              const canonical = isCanonicalType(w.type);
              const thisPairKey = pairKey(w);
              const partnerType = complementType(w.type);
              const hasPartner = !!(isPairedType(w.type) && wires.some(
                (other) =>
                  other.id !== w.id &&
                  pairKey(other) === thisPairKey &&
                  other.type === partnerType
              ));

              const obstacles = components.map(c => {
                const def = partsLibrary[c.partKey];
                return { x: c.x, y: c.y, width: def?.width ?? 0, height: def?.height ?? 0 };
              });

              let base;
              try {
                // Always use manhattanPath for strict cardinal routing
                base = manhattanPath(a, b, 0, obstacles);
              } catch (e) {
                console.error("Routing error, falling back to straight line:", e);
                base = `M ${a.x},${a.y} L ${b.x},${b.y}`;
              }

              // Snap all path vertices to the grid to avoid micro off-grid artifacts
              function snapPathToGrid(path: string): string {
                const parts = Array.from(path.matchAll(/([ML])\s*(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g));
                if (!parts.length) return path;
                let d = '';
                for (let i = 0; i < parts.length; i++) {
                  const cmd = parts[i][1];
                  const x = snap(parseFloat(parts[i][2]));
                  const y = snap(parseFloat(parts[i][3]));
                  d += `${i === 0 ? 'M' : ' L'} ${x},${y}`;
                }
                return d;
              }
              base = snapPathToGrid(base);

              // Consistent, grid-aligned offset for pairs
              const width = strokeWidthForGauge(w.gauge);
              const isSingleStrand = w.type === 'ethernet' || w.type === 'usb';
              const rawPairOffset = isSingleStrand ? 0 : offsetForPair(w.type);
              // Always use a multiple of GRID for offset
              const pairOffset = Math.max(GRID, isSingleStrand ? 0 : width * 0.7 + 2);

              function offsetPath(path: string, offset: number): string {
                const pts = Array.from(path.matchAll(/([ML])\s*(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)).map(m => ({ x: parseFloat(m[2]), y: parseFloat(m[3]) }));
                if (pts.length < 2) return path;
                const out: {x:number;y:number}[] = [];
                for (let i = 1; i < pts.length; i++) {
                  const a = pts[i - 1];
                  const b = pts[i];
                  // Only cardinal segments, so offset is always up/down or left/right
                  let n = { x: 0, y: 0 };
                  if (a.x === b.x) n = { x: offset, y: 0 }; // vertical segment, offset horizontally
                  else if (a.y === b.y) n = { x: 0, y: offset }; // horizontal segment, offset vertically
                  const start = { x: a.x + n.x, y: a.y + n.y };
                  const end = { x: b.x + n.x, y: b.y + n.y };
                  if (i === 1) out.push(start);
                  const prev = out[out.length - 1];
                  if (!prev || prev.x !== end.x || prev.y !== end.y) out.push(end);
                }
                let d2 = `M ${out[0].x} ${out[0].y}`;
                for (let i = 1; i < out.length; i++) d2 += ` L ${out[i].x} ${out[i].y}`;
                return d2;
              }

              // Colors and pair rendering
              const colors = (() => {
                if (w.type === "canH" || w.type === "canL") {
                  return { baseColor: terminalColors["canH"], offsetColor: terminalColors["canL"] };
                }
                if (w.type === "power+" || w.type === "power-") {
                  return { baseColor: terminalColors["power+"], offsetColor: terminalColors["power-"] };
                }
                if (w.type === "signal+" || w.type === "signal-") {
                  return { baseColor: terminalColors["signal+"], offsetColor: terminalColors["signal-"] };
                }
                if (w.type === 'ethernet') {
                  return { baseColor: terminalColors['ethernet'], offsetColor: terminalColors['ethernet'] };
                }
                if (w.type === 'usb') {
                  return { baseColor: terminalColors['usb'], offsetColor: terminalColors['usb'] };
                }
                return { baseColor: terminalColors[w.type], offsetColor: terminalColors[w.type] };
              })();



              // If this is a non-canonical paired wire and its partner exists, skip visible draw to avoid double-render/overlap
              if (!isSingleStrand && hasPartner && !canonical && isPairedType(w.type)) {
                return null;
              }

              // Composite rendering for paired wires: draw two symmetric offsets around the centerline
              const renderPairedComposite = !isSingleStrand && hasPartner && canonical && isPairedType(w.type);

              return (
                <g key={w.id} onClick={() => select({ type: "wire", id: w.id })}>
                  {renderPairedComposite ? (
                    <>
                      {(() => {
                        const half = Math.max(pairOffset / 2, width * 0.6 + 1);
                        const left = offsetPath(base, -half);
                        const right = offsetPath(base, +half);
                        const sw = Math.max(1.5, width - 0.2);
                        return (
                          <>
                            <path d={left} fill="none" stroke={colors.baseColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
                            <path d={right} fill="none" stroke={colors.offsetColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
                            {/* Wide transparent hit area for selection */}
                            <path d={base} fill="none" stroke="transparent" strokeWidth={sw + 12} pointerEvents="stroke" style={{ cursor: "pointer" }} />
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <>
                      <path d={base} fill="none" stroke={colors.baseColor} strokeWidth={isSingleStrand ? Math.max(3, width + 2) : width} strokeLinecap="round" strokeLinejoin="round" style={{ cursor: "pointer" }} />
                      <path d={base} fill="none" stroke="transparent" strokeWidth={(isSingleStrand ? Math.max(3, width + 2) : width) + 10} pointerEvents="stroke" style={{ cursor: "pointer" }} />
                      {/* legacy offset draw when no partner present but type is paired (keep visual hint if needed) */}
                      {!isSingleStrand && isPairedType(w.type) && hasPartner && canonical && (
                        <></>
                      )}
                    </>
                  )}
                </g>
              );
            } catch (err) {
              console.error("Wire render error:", err);
              return null;
            }
          })}

          {/* interactive routing preview */}
          {connectingFrom && previewPath && (
            <path
              d={previewPath}
              fill="none"
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              strokeDasharray="6 4"
              pointerEvents="stroke"
              style={{ cursor: "crosshair" }}
              onClick={addWaypointFromEvent}
            />
          )}

          {/* parts */}
          {components.map((c) => {
            const def = partsLibrary[c.partKey];
            if (!def) return null;
            return (
              <ComponentDraggable 
                key={c.id} 
                component={c} 
                definition={def} 
                onMouseDown={onPartMouseDown}
                onTerminalClick={onTerminalClick}
              />
            );
          })}
        </g>
      </svg>
      {/* toolbar: stop routing */}
      {connectingFrom && (
        <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-background/80 backdrop-blur rounded-md px-3 py-2 border border-border shadow">
          <button
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-border hover:bg-accent text-sm"
            onClick={() => { cancelConnection(); setPreviewMouse(null); }}
            title="Stop wiring (Esc)"
          >
            <span aria-hidden>🖱️</span>
            <span>Stop wiring</span>
          </button>
          <button
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-border hover:bg-accent text-sm"
            onClick={() => popConnectingPoint()}
            title="Undo last point (Ctrl/Cmd+Z)"
          >
            ⟲ Undo point
          </button>
        </div>
      )}
    </div>
  );
};

// Component that can be dragged back to palette to delete
const ComponentDraggable = ({ component, definition, onMouseDown, onTerminalClick }: {
  component: any;
  definition: PartDefinition;
  onMouseDown: (id: string, e: React.MouseEvent) => void;
  onTerminalClick: (componentId: string, terminalId: string) => void;
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "COMPONENT",
    item: { componentId: component.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <g 
      ref={drag}
      transform={`translate(${component.x}, ${component.y})`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <rect
        x={0}
        y={0}
        width={definition.width}
        height={definition.height}
        rx={8}
        fill="hsl(var(--card))"
        stroke="hsl(var(--border))"
        strokeWidth={1}
        onMouseDown={(e) => onMouseDown(component.id, e)}
        style={{ cursor: "grab" }}
      />
      <text x={8} y={18} fill="hsl(var(--foreground))" style={{ font: '12px ui-sans-serif' }}>
        {component.name}
      </text>
      {definition.terminals.map((t) => (
        <circle
          key={t.id}
          cx={t.x}
          cy={t.y}
          r={7.5}
          fill={terminalColor(t.type)}
          stroke="hsl(var(--foreground)/0.4)"
          strokeWidth={1}
          className="cursor-pointer"
          onClick={() => onTerminalClick(component.id, t.id)}
        />
      ))}
    </g>
  );
};

function terminalColor(type: Terminal["type"]) {
  return terminalColors[type];
}

function wirePairColors(type: Terminal["type"]) {
  if (type === "canH" || type === "canL") {
    return { baseColor: terminalColors["canH"], offsetColor: terminalColors["canL"] };
  }
  if (type === "power+" || type === "power-") {
    return { baseColor: terminalColors["power+"], offsetColor: terminalColors["power-"] };
  }
  if (type === "signal+" || type === "signal-") {
    return { baseColor: terminalColors["signal+"], offsetColor: terminalColors["signal-"] };
  }
  return { baseColor: terminalColors[type], offsetColor: terminalColors[type] };
}
