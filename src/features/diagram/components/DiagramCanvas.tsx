import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useDrop, useDrag } from "react-dnd";
import { useDiagramStore } from "@/state/diagramStore";
import partsJson from "../parts/library930.json";
import { loadCustomParts } from "../parts/customParts";
import type { PartDefinition, Terminal } from "@/types/diagram";
import { terminalColors } from "@/types/diagram";
import { strokeWidthForGauge, offsetForPair, kiCadRoute } from "@/utils/routing";
import { canConnect } from "@/utils/validation";
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
  const { components, wires, zoom, panX, panY, setZoom, setPan, addComponent, setPartsLibrary, select, startConnection, completeConnection, connectingFrom, partsLibrary, moveComponent, setWireControlPoints, removeComponent, addConnectingPoint, clearConnectingPath, connectingPoints, cancelConnection, popConnectingPoint } = useDiagramStore();
  const { labels, addWireLabel } = useDiagramStore((s) => ({ labels: (s as any).labels, addWireLabel: (s as any).addWireLabel }));
  const settings = useDiagramStore((s) => (s as any).settings);

  // Live preview mouse for interactive routing
  const [previewMouse, setPreviewMouse] = useState<{ x:number; y:number } | null>(null);

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

  const onTerminalClick = (componentId: string, terminalId: string) => {
    if (!connectingFrom) {
      startConnection({ componentId, terminalId });
      setPreviewMouse(null);
    } else {
      if (connectingFrom.componentId === componentId && connectingFrom.terminalId === terminalId) {
        return;
      }
      const aPart = partsLibrary[components.find(c => c.id === connectingFrom.componentId)!.partKey];
      const bPart = partsLibrary[components.find(c => c.id === componentId)!.partKey];
      const aTerm = aPart.terminals.find(t => t.id === connectingFrom.terminalId)!;
      const bTerm = bPart.terminals.find(t => t.id === terminalId)!;
      if (!canConnect(aTerm.type, bTerm.type)) {
        toast.warning("Terminal types do not match. Connection blocked.");
        return;
      }

      // Nudge behavior: if the destination terminal is only a tiny offset away from a clean 0/45/90 from the last waypoint, move the part slightly instead of making a micro wire jog.
      try {
        const startComp = components.find(c => c.id === connectingFrom.componentId);
        const destComp = components.find(c => c.id === componentId);
        if (startComp && destComp) {
          const start = { x: startComp.x + aTerm.x, y: startComp.y + aTerm.y };
          const last = connectingPoints.length ? connectingPoints[connectingPoints.length - 1] : start;
          const dest = { x: destComp.x + bTerm.x, y: destComp.y + bTerm.y };
          const snapped = snapToEightFrom(last, dest);
          const dx = snapped.x - dest.x;
          const dy = snapped.y - dest.y;
          const NUDGE_MAX = GRID * 1.0; // allow up to one grid nudge to keep clean geometry
          const needsNudge = Math.hypot(dx, dy) > 0 && Math.abs(dx) <= NUDGE_MAX && Math.abs(dy) <= NUDGE_MAX;
          if (needsNudge) {
            // Move destination component so its terminal lands on the snapped point, while keeping component position snapped to grid.
            const targetCompX = snap(snapped.x - bTerm.x);
            const targetCompY = snap(snapped.y - bTerm.y);
            moveComponent(destComp.id, targetCompX, targetCompY);
          }
        }
      } catch (e) {
        console.warn("Nudge failed, proceeding without moving part:", e);
      }

      completeConnection({ componentId, terminalId });
      setPreviewMouse(null);
    }
  };

  // Basic component dragging with relative offset
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  
  // Wire segment dragging (disabled)
  const [draggedSegment, setDraggedSegment] = useState<{ wireId: string; segIdx: number; startPos: { x: number; y: number }; pts?: { x: number; y: number }[] } | null>(null);

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

          {/* wires */}
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
              
              const obstacles = components.map(c => {
                const def = partsLibrary[c.partKey];
                return { x: c.x, y: c.y, width: def?.width ?? 0, height: def?.height ?? 0 };
              });

              // Helper: link using 0/45/90 only between two points, returning intermediate points (excluding start, including end)
              function linkOrth45(p: {x:number;y:number}, q: {x:number;y:number}): {x:number;y:number}[] {
                const dx = q.x - p.x;
                const dy = q.y - p.y;
                if (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) {
                  return [q];
                }
                // Default to horizontal then vertical
                return [{ x: q.x, y: p.y }, q];
              }
              
              let base;
              if (w.controlPoints && w.controlPoints.length > 0) {
                const pts = [a, ...w.controlPoints];
                // Enforce final leg to terminal to be 0/45/90
                const tail = linkOrth45(pts[pts.length - 1], b);
                const all = [...pts, ...tail];
                base = `M ${all[0].x},${all[0].y}`;
                for (let i = 1; i < all.length; i++) {
                  base += ` L ${all[i].x},${all[i].y}`;
                }
              } else {
                try {
                  // Default auto-router for legacy/no-control wires
                  // Rebuild a strict path every render so if parts moved, we stay 0/45/90
                  // Build HV segments from other wires to discourage riding along them (orthogonal crossing allowed)
                  const hvSegments = wires
                    .filter(v => v.id !== w.id)
                    .flatMap(v => {
                      const vaComp = components.find((c) => c.id === v.from.componentId);
                      const vbComp = components.find((c) => c.id === v.to.componentId);
                      if (!vaComp || !vbComp) return [] as {x1:number;y1:number;x2:number;y2:number}[];
                      const vaTerm = (partsLibrary[vaComp.partKey]?.terminals || []).find((t) => t.id === v.from.terminalId);
                      const vbTerm = (partsLibrary[vbComp.partKey]?.terminals || []).find((t) => t.id === v.to.terminalId);
                      if (!vaTerm || !vbTerm) return [] as {x1:number;y1:number;x2:number;y2:number}[];
                      const pa = { x: vaComp.x + vaTerm.x, y: vaComp.y + vaTerm.y };
                      const pb = { x: vbComp.x + vbTerm.x, y: vbComp.y + vbTerm.y };
                      const pts = [pa, ...(v.controlPoints ?? []), pb];
                      const segs: {x1:number;y1:number;x2:number;y2:number}[] = [];
                      for (let i=1;i<pts.length;i++) {
                        const p = pts[i-1], q = pts[i];
                        if (p.x === q.x || p.y === q.y) segs.push({ x1: p.x, y1: p.y, x2: q.x, y2: q.y });
                      }
                      return segs;
                    });
                  const d = kiCadRoute(a, b, obstacles, { gridSize: GRID, clearance: GRID, escape: GRID * 2, existingSegments: hvSegments });
                  // Convert this runtime path into control points for consistent offsetting and strictness
                  const pts = Array.from(d.matchAll(/([ML])\s*(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)).map(m => ({ x: snap(parseFloat(m[2])), y: snap(parseFloat(m[3])) }));
                  if (pts.length >= 2) {
                    const cps = pts.slice(1, pts.length - 1);
                    // store once so future renders use control points
                    setWireControlPoints(w.id, () => cps);
                  }
                  base = d;
                } catch (e) {
                  console.error("Routing error, falling back to straight line:", e);
                  base = `M ${a.x},${a.y} L ${b.x},${b.y}`;
                }
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
              
              const width = strokeWidthForGauge(w.gauge);
              const isSingleStrand = w.type === 'ethernet' || w.type === 'usb';
              const rawPairOffset = isSingleStrand ? 0 : offsetForPair(w.type);
              const pairOffset = Math.max(rawPairOffset, isSingleStrand ? 0 : width * 0.7 + 2);

              function offsetPath(path: string, offset: number): string {
                const pts = Array.from(path.matchAll(/([ML])\s*(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)).map(m => ({ x: parseFloat(m[2]), y: parseFloat(m[3]) }));
                if (pts.length < 2) return path;
                const out: {x:number;y:number}[] = [];
                const unitLeft = (a: any, b: any) => {
                  const dx = b.x - a.x, dy = b.y - a.y;
                  const len = Math.hypot(dx, dy) || 1;
                  return { x: -dy / len, y: dx / len };
                };
                for (let i = 1; i < pts.length; i++) {
                  const a = pts[i - 1];
                  const b = pts[i];
                  const n = unitLeft(a, b);
                  const start = { x: a.x + n.x * offset, y: a.y + n.y * offset };
                  const end = { x: b.x + n.x * offset, y: b.y + n.y * offset };
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

              const isPairedType = (t: Terminal["type"]) => (
                t === "power+" || t === "power-" || t === "signal+" || t === "signal-" || t === "canH" || t === "canL"
              );

              // Composite/partner flags computed once here
              const compT = complementType(w.type);
              const hasPartner = !!compT && wires.some(v => v.type === compT && (
                ((v.from.componentId === w.from.componentId && v.to.componentId === w.to.componentId) ||
                 (v.from.componentId === w.to.componentId && v.to.componentId === w.from.componentId))
              ) && v.netId === w.netId);
              const canonical = isCanonicalType(w.type);
              const compositeRequested = settings?.pair?.alwaysComposite ?? true;
              const renderPairedComposite = !isSingleStrand && isPairedType(w.type) && canonical && (compositeRequested || hasPartner);

              // If a partner exists, skip non-canonical to avoid duplicate visual
              if (!isSingleStrand && isPairedType(w.type) && hasPartner && !canonical) {
                return null;
              }

              return (
                <g key={w.id} onClick={() => select({ type: "wire", id: w.id })}>
                  {renderPairedComposite ? (
                    <>
                      {(() => {
                        const spacing = (settings?.pair?.stripeSpacing ?? pairOffset);
                        const half = Math.max(spacing / 2, width * 0.6 + 1);
                        const left = offsetPath(base, -half);
                        const right = offsetPath(base, +half);
                        const thicknessScale = settings?.pair?.stripeThicknessScale ?? 1.0;
                        const sw = Math.max(1.5, width * thicknessScale);
                        return (
                          <>
                            <path d={left} fill="none" stroke={colors.baseColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
                            <path d={right} fill="none" stroke={colors.offsetColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
                            <path d={base} fill="none" stroke="transparent" strokeWidth={sw + 12} pointerEvents="stroke" style={{ cursor: "pointer" }} />
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <>
                      <path d={base} fill="none" stroke={colors.baseColor} strokeWidth={isSingleStrand ? Math.max(3, width + 2) : width} strokeLinecap="round" strokeLinejoin="round" style={{ cursor: "pointer" }} />
                      <path d={base} fill="none" stroke="transparent" strokeWidth={(isSingleStrand ? Math.max(3, width + 2) : width) + 10} pointerEvents="stroke" style={{ cursor: "pointer" }} />
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
        </div> //apple -AA ron
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
  const settings = useDiagramStore((s) => (s as any).settings);

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
          r={settings?.visuals?.terminalRadius ?? 7.5}
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
