import { useState, useRef } from "react";
import { useDiagramStore } from "@/state/diagramStore";
import type { PartDefinition, Terminal, TerminalType } from "@/types/diagram";
import { addCustomPart } from "../parts/customParts";
import { terminalColors } from "@/types/diagram";

export function CustomPartMenu({ onClose }: { onClose: () => void }) {
  const { addPartDefinition } = useDiagramStore((s) => ({ addPartDefinition: (s as any).addPartDefinition }));
  const [name, setName] = useState("");
  const [width, setWidth] = useState(160);
  const [height, setHeight] = useState(80);
  const [terms, setTerms] = useState<Terminal[]>([]);
  const [previewScale, setPreviewScale] = useState(1);
  const [draggingTerm, setDraggingTerm] = useState<string | null>(null);
  const [resizing, setResizing] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const GRID = 8;
  const termTypes: TerminalType[] = ["power+","power-","canH","canL","signal+","signal-","ethernet","usb"];
  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const snap = (n: number) => Math.round(n / GRID) * GRID;

  const save = () => {
    if (!name.trim()) return;
    const key = `${slugify(name)}-${Date.now().toString(36)}`;
    const part: PartDefinition = { key, name, width, height, terminals: terms };
    addCustomPart(part); // persist
    addPartDefinition(part); // make available immediately
    window.dispatchEvent(new CustomEvent('custom-parts-updated'));
    onClose();
  };

  const onSvgMouseMove: React.MouseEventHandler<SVGSVGElement> = (e) => {
    if (!svgRef.current) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;
    const p = pt.matrixTransform(ctm.inverse());
    // convert to part local space (account for translate and scale)
    const ox = 20, oy = 20;
    const x = (p.x - ox) / previewScale;
    const y = (p.y - oy) / previewScale;

    if (draggingTerm) {
      setTerms(arr => arr.map(t => t.id === draggingTerm ? { ...t, x: Math.max(0, Math.min(width, snap(x))), y: Math.max(0, Math.min(height, snap(y))) } : t));
    } else if (resizing) {
      setWidth(w => Math.max(40, snap(x)));
      setHeight(h => Math.max(40, snap(y)));
    }
  };

  const onSvgMouseUp: React.MouseEventHandler<SVGSVGElement> = () => {
    setDraggingTerm(null);
    setResizing(false);
  };

  const onSvgMouseLeave: React.MouseEventHandler<SVGSVGElement> = () => {
    setDraggingTerm(null);
    setResizing(false);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur">
      <div className="absolute top-4 left-4">
        <button className="px-3 py-1.5 rounded-lg border border-border hover:bg-accent text-sm" onClick={onClose}>← Back</button>
      </div>
      <div className="w-[min(1100px,95vw)] max-h-[90vh] overflow-auto rounded-2xl border border-border shadow bg-card/70 p-6 grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img src="/favicon.ico" alt="Logo" className="w-8 h-8" />
            <h2 className="text-xl font-semibold">Custom Part Designer</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 items-center">
            <label className="text-sm">Name</label>
            <input className="bg-background border border-border rounded px-2 py-1 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
            <label className="text-sm">Width</label>
            <input type="number" className="bg-background border border-border rounded px-2 py-1 text-sm" value={width} onChange={(e) => setWidth(Number(e.target.value))} />
            <label className="text-sm">Height</label>
            <input type="number" className="bg-background border border-border rounded px-2 py-1 text-sm" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Terminals</div>
            {terms.map((t, i) => (
              <div key={i} className="grid grid-cols-6 gap-2 items-center">
                <input placeholder="id" value={t.id} onChange={(e) => setTerms(arr => arr.map((x, idx) => idx===i? { ...x, id: e.target.value } : x))} className="bg-background border border-border rounded px-2 py-1 text-sm" />
                <input placeholder="label" value={t.label} onChange={(e) => setTerms(arr => arr.map((x, idx) => idx===i? { ...x, label: e.target.value } : x))} className="bg-background border border-border rounded px-2 py-1 text-sm" />
                <select value={t.type} onChange={(e) => setTerms(arr => arr.map((x, idx) => idx===i? { ...x, type: e.target.value as TerminalType } : x))} className="bg-background border border-border rounded px-2 py-1 text-sm">
                  {termTypes.map((ty) => (<option key={ty} value={ty}>{ty}</option>))}
                </select>
                <input type="number" placeholder="x" value={t.x} onChange={(e) => setTerms(arr => arr.map((x, idx) => idx===i? { ...x, x: Number(e.target.value) } : x))} className="bg-background border border-border rounded px-2 py-1 text-sm" />
                <input type="number" placeholder="y" value={t.y} onChange={(e) => setTerms(arr => arr.map((x, idx) => idx===i? { ...x, y: Number(e.target.value) } : x))} className="bg-background border border-border rounded px-2 py-1 text-sm" />
                <button className="px-2 py-1 rounded border border-border hover:bg-accent text-xs" onClick={() => setTerms(arr => arr.filter((_, idx) => idx !== i))}>Remove</button>
              </div>
            ))}
            <button className="px-3 py-1.5 rounded border border-border hover:bg-accent text-sm" onClick={() => setTerms(arr => [...arr, { id: `t${terms.length+1}`, label: `T${terms.length+1}`, type: "power+", x: 8, y: 8 }])}>Add terminal</button>
          </div>
          <div className="flex justify-end">
            <button className="px-4 py-2 rounded-lg border border-border hover:bg-accent" onClick={save}>Save Part</button>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Live Preview</div>
            <input type="range" min={0.5} max={2} step={0.1} value={previewScale} onChange={(e) => setPreviewScale(Number(e.target.value))} />
          </div>
          <div className="rounded-md border border-border bg-background/60 p-4">
            <svg ref={svgRef} width={width*previewScale+40} height={height*previewScale+40} onMouseMove={onSvgMouseMove} onMouseUp={onSvgMouseUp} onMouseLeave={onSvgMouseLeave}>
              <g transform={`translate(20,20) scale(${previewScale})`}>
                <rect x={0} y={0} width={width} height={height} rx={10} fill="hsl(var(--card))" stroke="hsl(var(--border))" />
                {/* resize handle */}
                <rect x={width-10} y={height-10} width={10} height={10} fill="hsl(var(--accent))" className="cursor-se-resize" onMouseDown={() => setResizing(true)} />
                {terms.map((t) => (
                  <g key={t.id} className="cursor-move" onMouseDown={() => setDraggingTerm(t.id)}>
                    <circle cx={t.x} cy={t.y} r={6} fill={terminalColors[t.type]} stroke="hsl(var(--foreground)/0.4)" />
                    <text x={t.x+8} y={t.y+4} fontSize={10} fill="hsl(var(--foreground))">{t.label}</text>
                  </g>
                ))}
              </g>
            </svg>
          </div>
          <div className="text-xs text-muted-foreground">Tip: Drag the corner to resize. Terminals snap to an invisible grid. Terminal color follows its type.</div>
        </div>
      </div>
    </div>
  );
}
