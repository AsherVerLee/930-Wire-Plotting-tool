import { useMemo, useRef, useState, useEffect } from "react";
import { useDrop } from "react-dnd";
import { useDiagramStore } from "@/state/diagramStore";
import partsJson from "../parts/library930.json";
import { loadCustomParts } from "../parts/customParts";
import type { PartDefinition, Terminal } from "@/types/diagram";
import { terminalColors } from "@/types/diagram";
import { manhattanPath, strokeWidthForGauge, offsetForPair } from "@/utils/routing";
import { canConnect } from "@/utils/validation";
import { toast } from "sonner";

const GRID = 16;

function snap(n: number) {
  return Math.round(n / GRID) * GRID;
}

export const DiagramCanvas = () => {
  const ref = useRef<SVGSVGElement | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const { components, wires, zoom, panX, panY, setZoom, setPan, addComponent, setPartsLibrary, select, startConnection, completeConnection, connectingFrom, partsLibrary, moveComponent } = useDiagramStore();

  // Initialize library in store once
  useEffect(() => {
    const custom = loadCustomParts();
    setPartsLibrary([...(partsJson as PartDefinition[]), ...custom]);
  }, [setPartsLibrary]);

  const [, drop] = useDrop(
    () => ({
      accept: "PART",
      drop: (item: { partKey: string }, monitor) => {
        const client = monitor.getClientOffset();
        const svg = ref.current;
        if (!client || !svg) return;
        const pt = svg.createSVGPoint();
        pt.x = client.x; pt.y = client.y;
        const ctm = svg.getScreenCTM();
        if (!ctm) return;
        const cursor = pt.matrixTransform(ctm.inverse());
        const x = snap((cursor.x - panX) / zoom);
        const y = snap((cursor.y - panY) / zoom);
        addComponent(item.partKey, x, y);
      },
    }),
    [zoom, panX, panY, addComponent]
  );

  drop(ref);

  const onWheel: React.WheelEventHandler<SVGSVGElement> = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const next = Math.min(2, Math.max(0.25, zoom + delta));
    setZoom(next);
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
      completeConnection({ componentId, terminalId });
    }
  };

  // Basic component dragging inside SVG (mousedown on body)
  const [dragId, setDragId] = useState<string | null>(null);
  const onPartMouseDown = (id: string, e: React.MouseEvent) => {
    if (e.button !== 0) return; // left only
    setDragId(id);
    select({ type: "component", id });
  };
  const onSvgMouseMove: React.MouseEventHandler<SVGSVGElement> = (e) => {
    onMouseMove(e);
    if (dragId && ref.current) {
      const svg = ref.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const cursor = pt.matrixTransform(ctm.inverse());
      const x = snap((cursor.x - panX) / zoom);
      const y = snap((cursor.y - panY) / zoom);
      moveComponent(dragId, x, y);
    }
  };
  const onSvgMouseUp: React.MouseEventHandler<SVGSVGElement> = (e) => {
    onMouseUp(e);
    setDragId(null);
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] bg-background/40 rounded-lg border border-border overflow-hidden">
      <svg
        ref={ref}
        className="w-full h-full touch-none select-none"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onSvgMouseMove}
        onMouseUp={onSvgMouseUp}
      >
        {/* grid */}
        <defs>
          <pattern id="grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
            <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid)" />

        <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
          {/* wires */}
          {wires.map((w) => {
            const aComp = components.find((c) => c.id === w.from.componentId);
            const bComp = components.find((c) => c.id === w.to.componentId);
            if (!aComp || !bComp) return null;
            const aTerm = (partsLibrary[aComp.partKey]?.terminals || []).find((t) => t.id === w.from.terminalId);
            const bTerm = (partsLibrary[bComp.partKey]?.terminals || []).find((t) => t.id === w.to.terminalId);
            if (!aTerm || !bTerm) return null;
            const a = getTerminalAbs(aComp.id, aTerm);
            const b = getTerminalAbs(bComp.id, bTerm);
            const base = manhattanPath(a, b, 0);
            const width = strokeWidthForGauge(w.gauge);
            const pairOffset = offsetForPair(w.type);
            const { baseColor, offsetColor } = wirePairColors(w.type);
            return (
              <g key={w.id} onClick={() => select({ type: "wire", id: w.id })}>
                <path d={base} fill="none" stroke={baseColor} strokeWidth={width} strokeLinecap="round" />
                {pairOffset > 0 && (
                  <path d={manhattanPath(a, b, pairOffset)} fill="none" stroke={offsetColor} strokeWidth={Math.max(1.5, width - 0.6)} strokeLinecap="round" />
                )}
              </g>
            );
          })}

          {/* parts */}
          {components.map((c) => {
            const def = partsLibrary[c.partKey];
            if (!def) return null;
            return (
              <g key={c.id} transform={`translate(${c.x}, ${c.y})`}>
                <rect
                  x={0}
                  y={0}
                  width={def.width}
                  height={def.height}
                  rx={8}
                  fill="hsl(var(--card))"
                  stroke="hsl(var(--border))"
                  strokeWidth={1}
                  onMouseDown={(e) => onPartMouseDown(c.id, e)}
                />
                <text x={8} y={18} fill="hsl(var(--foreground))" style={{ font: '12px ui-sans-serif' }}>{c.name}</text>
                {def.terminals.map((t) => (
                  <circle
                    key={t.id}
                    cx={t.x}
                    cy={t.y}
                    r={5}
                    fill={terminalColor(t.type)}
                    className="cursor-pointer"
                    onClick={() => onTerminalClick(c.id, t.id)}
                  />
                ))}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
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
