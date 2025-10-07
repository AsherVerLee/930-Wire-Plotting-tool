import { useDiagramStore } from "@/state/diagramStore";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const PropertiesPanel = () => {
  const { selected, components, rotateComponent, wires, setWireGauge, renameComponent } = useDiagramStore();
  const { labels, addWireLabel, updateWireLabel, removeWireLabel } = useDiagramStore((s: any) => ({ labels: s.labels, addWireLabel: s.addWireLabel, updateWireLabel: s.updateWireLabel, removeWireLabel: s.removeWireLabel }));
  const comp = selected?.type === "component" ? components.find(c => c.id === selected.id) : null;
  const wire = selected?.type === "wire" ? wires.find(w => w.id === selected.id) : null;

  if (!selected) {
    return (
      <aside className="w-72 shrink-0 h-[calc(100vh-64px)] border-l border-border bg-card/50 p-4">
        <div className="text-sm text-muted-foreground">Select a component or wire to edit properties.</div>
      </aside>
    );
  }

  if (comp) {
    return (
      <aside className="w-72 shrink-0 h-[calc(100vh-64px)] border-l border-border bg-card/50 p-4 space-y-4">
        <div className="text-sm font-semibold">Component</div>
        <Separator />
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={comp.name} onChange={(e) => renameComponent(comp.id, e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Rotation</Label>
          <select value={comp.rotation} onChange={(e) => rotateComponent(comp.id, parseInt(e.target.value) as any)} className="bg-background border border-border rounded px-2 py-1 text-sm w-full">
            <option value={0}>0°</option>
            <option value={90}>90°</option>
            <option value={180}>180°</option>
            <option value={270}>270°</option>
          </select>
        </div>
      </aside>
    );
  }

  if (wire) {
    const gaugeLocked = wire.type === 'ethernet' || wire.type === 'usb';
    const wireLabels = labels?.filter(l => l.wireId === wire.id) ?? [];
    return (
      <aside className="w-72 shrink-0 h-[calc(100vh-64px)] border-l border-border bg-card/50 p-4 space-y-4">
        <div className="text-sm font-semibold">Wire</div>
        <Separator />
        {!gaugeLocked && (
          <div className="space-y-2">
            <Label>Gauge (AWG)</Label>
            <select value={wire.gauge} onChange={(e) => setWireGauge(wire.id, parseInt(e.target.value) as any)} className="bg-background border border-border rounded px-2 py-1 text-sm w-full">
              {[10,12,14,16,18,20,22].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        )}
        {gaugeLocked && (
          <div className="text-xs text-muted-foreground">Gauge locked for {wire.type.toUpperCase()} cabling.</div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Labels</Label>
            <button className="px-2 py-1 text-xs rounded border border-border hover:bg-accent" onClick={() => addWireLabel(wire.id)}>Add</button>
          </div>
          <div className="space-y-2">
            {wireLabels.length === 0 && (
              <div className="text-xs text-muted-foreground">No labels yet.</div>
            )}
            {wireLabels.map((l) => (
              <div key={l.id} className="flex items-center gap-2">
                <Input className="h-8" value={l.text} onChange={(e) => updateWireLabel(l.id, e.target.value)} />
                <button className="px-2 py-1 text-xs rounded border border-border hover:bg-destructive/10" onClick={() => removeWireLabel(l.id)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 shrink-0 h-[calc(100vh-64px)] border-l border-border bg-card/50 p-4">
      <div className="text-sm font-semibold">Wire</div>
      <Separator className="my-2" />
      <div className="text-xs text-muted-foreground">Gauge and net editing coming next iteration.</div>
    </aside>
  );
};
