import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useDiagramStore } from "@/state/diagramStore";
import { exportPNG, exportPDF, saveProject, loadProject } from "@/utils/exporters";
import { Save, FolderOpen, Undo2, Redo2, ZoomIn, ZoomOut, Download, HelpCircle, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

export const Toolbar = () => {
  const { undo, redo, setZoom, zoom, saveDto, loadDto, removeSelected } = useDiagramStore();
  const canvasRef = useRef<HTMLElement | null>(null);
  const [dpi, setDpi] = useState(192);

  const onExportPNG = async () => {
    const el = document.getElementById("diagram-root");
    if (!el) return;
    await exportPNG(el, dpi);
  };
  const onExportPDF = async () => {
    const el = document.getElementById("diagram-root");
    if (!el) return;
    await exportPDF(el, dpi);
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-border bg-gradient-to-r from-background to-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">FRC 930 Wiring Designer</span>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <Button variant="secondary" size="sm" onClick={async () => saveProject(saveDto())}><Save className="h-4 w-4 mr-2" />Save</Button>
        <Button variant="secondary" size="sm" onClick={async () => { const dto = await loadProject(); if (dto) loadDto(dto); }}><FolderOpen className="h-4 w-4 mr-2" />Load</Button>
        <Button variant="secondary" size="sm" onClick={undo}><Undo2 className="h-4 w-4 mr-2" />Undo</Button>
        <Button variant="secondary" size="sm" onClick={redo}><Redo2 className="h-4 w-4 mr-2" />Redo</Button>
        <Button variant="secondary" size="sm" onClick={removeSelected}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-xs text-muted-foreground">DPI</div>
        <select value={dpi} onChange={(e) => setDpi(parseInt(e.target.value))} className="bg-background border border-border rounded px-2 py-1 text-sm">
          {[96, 144, 192, 288, 384].map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <Button variant="secondary" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.1))}><ZoomIn className="h-4 w-4" /></Button>
        <Button variant="secondary" size="sm" onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}><ZoomOut className="h-4 w-4" /></Button>
        <Button variant="default" size="sm" onClick={onExportPNG}><Download className="h-4 w-4 mr-2" />PNG</Button>
        <Button variant="default" size="sm" onClick={onExportPDF}><Download className="h-4 w-4 mr-2" />PDF</Button>
      </div>
    </header>
  );
};
