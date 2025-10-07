import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useDiagramStore } from "@/state/diagramStore";
import { exportPNG, exportPDF, saveProject, loadProject } from "@/utils/exporters";
import { Save, FolderOpen, Undo2, Redo2, ZoomIn, ZoomOut, Download, Trash2, PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface ToolbarProps {
  onTogglePalette: () => void;
  paletteVisible: boolean;
}

export const Toolbar = ({ onTogglePalette, paletteVisible }: ToolbarProps) => {
  const { undo, redo, setZoom, zoom, saveDto, loadDto, removeSelected } = useDiagramStore();
  const settings = useDiagramStore(s => (s as any).settings);
  const setSettings = useDiagramStore(s => (s as any).setSettings);
  const setAutoCleanEnabled = useDiagramStore(s => (s as any).setAutoCleanEnabled);

  const onExportPNG = async () => {
    const el = document.getElementById("diagram-root");
    if (!el) return;
    await exportPNG(el, settings.export.dpi);
  };
  const onExportPDF = async () => {
    const el = document.getElementById("diagram-root");
    if (!el) return;
    await exportPDF(el, settings.export.dpi);
  };

  const cleanerOn = settings.validator.autoCleanEnabled;

  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-border bg-gradient-to-r from-background to-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onTogglePalette} aria-label={paletteVisible ? "Hide parts" : "Show parts"}>
          {paletteVisible ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
        </Button>
        <div className="flex items-center">
          <button className="rounded hover:bg-accent/40 p-1" onClick={() => window.dispatchEvent(new CustomEvent('open-landing'))}>
            <img src="/favicon.ico" alt="930 CircuitPilot" className="h-8 w-8" />
          </button>
        </div>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <Button variant="default" size="sm" onClick={async () => saveProject(saveDto())}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button variant="default" size="sm" onClick={async () => { const dto = await loadProject(); if (dto) loadDto(dto); }}>
          <FolderOpen className="h-4 w-4 mr-2" />
          Load
        </Button>
        <Button variant="secondary" size="sm" onClick={undo}><Undo2 className="h-4 w-4 mr-2" />Undo</Button>
        <Button variant="secondary" size="sm" onClick={redo}><Redo2 className="h-4 w-4 mr-2" />Redo</Button>
        <Button variant="secondary" size="sm" onClick={removeSelected}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <div className="flex items-center gap-2">
          <Switch id="auto-clean-switch" checked={cleanerOn} onCheckedChange={(v: boolean) => setAutoCleanEnabled(!!v)} />
          <label htmlFor="auto-clean-switch" className="text-sm select-none cursor-pointer flex items-center gap-1">
            <Sparkles className="h-4 w-4 opacity-70" />
            Auto Clean
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-xs text-muted-foreground">DPI</div>
        <select value={settings.export.dpi} onChange={(e) => setSettings({ export: { ...settings.export, dpi: parseInt(e.target.value) } })} className="bg-background border border-border rounded px-2 py-1 text-sm">
          {[96, 144, 192, 288, 384].map((v: number) => <option key={v} value={v}>{v}</option>)}
        </select>
        <Button variant="secondary" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.1))}><ZoomIn className="h-4 w-4" /></Button>
        <Button variant="secondary" size="sm" onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}><ZoomOut className="h-4 w-4" /></Button>
        <Button variant="default" size="sm" onClick={onExportPNG}><Download className="h-4 w-4 mr-2" />PNG</Button>
        <Button variant="default" size="sm" onClick={onExportPDF}><Download className="h-4 w-4 mr-2" />PDF</Button>
      </div>
    </header>
  );
};
