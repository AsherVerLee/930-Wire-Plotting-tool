import { useDiagramStore } from "@/state/diagramStore";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const PropertiesPanel = () => {
  const { selected, components, rotateComponent } = useDiagramStore();
  const comp = selected?.type === "component" ? components.find(c => c.id === selected.id) : null;

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
          <Input value={comp.name} onChange={() => { /* left as an exercise: add action to rename */ }} />
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

  return (
    <aside className="w-72 shrink-0 h-[calc(100vh-64px)] border-l border-border bg-card/50 p-4">
      <div className="text-sm font-semibold">Wire</div>
      <Separator className="my-2" />
      <div className="text-xs text-muted-foreground">Gauge and net editing coming next iteration.</div>
    </aside>
  );
};
