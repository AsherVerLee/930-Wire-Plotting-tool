import { useMemo, useState } from "react";
import { useDrag } from "react-dnd";
import parts from "../parts/library930.json";
import type { PartDefinition, TerminalType, Terminal } from "@/types/diagram";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useDiagramStore } from "@/state/diagramStore";
import { addCustomPart, loadCustomParts, removeCustomPart } from "../parts/customParts";

export const Palette = ({ visible = true }: { visible?: boolean }) => {
  const { setPartsLibrary } = useDiagramStore();
  const [q, setQ] = useState("");
  const [custom, setCustom] = useState<PartDefinition[]>(() => loadCustomParts());

  const library = parts as PartDefinition[];
  const list = useMemo(() => library.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())), [q, library]);

  if (!visible) return null;
  return (
    <aside className="w-72 shrink-0 h-[calc(100vh-64px)] border-r border-border bg-card/50">
      <Tabs defaultValue="library" className="h-full flex flex-col">
        <div className="p-3 flex items-center gap-2">
          <TabsList>
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="custom">My Parts</TabsTrigger>
          </TabsList>
          <Input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} className="ml-auto max-w-[160px]" />
        </div>

        <TabsContent value="library" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-[calc(100vh-64px-56px)]">
            <div className="p-2 space-y-2">
              {list.map((p) => (
                <PaletteItem key={p.key} part={p} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="custom" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-[calc(100vh-64px-56px)]">
            <div className="p-3 space-y-4">
              <CustomPartForm
                onCreate={(part) => {
                  const next = addCustomPart(part);
                  setCustom(next);
                  setPartsLibrary([...(parts as PartDefinition[]), ...next]);
                }}
              />
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Your Parts</div>
                {custom.length === 0 && (
                  <div className="text-xs text-muted-foreground">No custom parts yet.</div>
                )}
                {custom.map((p) => (
                  <div key={p.key} className="rounded-md border border-border p-3 bg-background/40 hover:bg-muted transition flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.terminals.length} terminals</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PaletteItem part={p} />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const next = removeCustomPart(p.key);
                          setCustom(next);
                          setPartsLibrary([...(parts as PartDefinition[]), ...next]);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </aside>
  );
};

const PaletteItem = ({ part }: { part: PartDefinition }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "PART",
    item: { key: part.key },
    collect: (m) => ({ isDragging: m.isDragging() }),
    end: (item, monitor) => {
      console.log("Drag ended:", item, "didDrop:", monitor.didDrop());
    },
  }));
  
  console.log("PaletteItem rendered for part:", part.key);
  
  return (
    <div ref={drag} className={`rounded-md border border-border p-3 bg-background/40 hover:bg-muted transition cursor-grab ${isDragging ? "opacity-50" : "opacity-100"}`}>
      <div className="text-sm font-medium">{part.name}</div>
      <div className="text-xs text-muted-foreground">{part.terminals.length} terminals</div>
    </div>
  );
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const TerminalRow = ({ t, onChange, onRemove }: { t: Terminal; onChange: (t: Terminal) => void; onRemove: () => void }) => {
  return (
    <div className="grid grid-cols-6 gap-2 items-center">
      <Input placeholder="id" value={t.id} onChange={(e) => onChange({ ...t, id: e.target.value })} />
      <Input placeholder="label" value={t.label} onChange={(e) => onChange({ ...t, label: e.target.value })} />
      <select value={t.type} onChange={(e) => onChange({ ...t, type: e.target.value as TerminalType })} className="bg-background border border-border rounded px-2 py-1 text-sm">
        {(["power+","power-","canH","canL","signal+","signal-","ethernet","usb"] as TerminalType[]).map((ty) => (
          <option key={ty} value={ty}>{ty}</option>
        ))}
      </select>
      <Input type="number" placeholder="x" value={t.x} onChange={(e) => onChange({ ...t, x: Number(e.target.value) })} />
      <Input type="number" placeholder="y" value={t.y} onChange={(e) => onChange({ ...t, y: Number(e.target.value) })} />
      <Button variant="secondary" onClick={onRemove}>Remove</Button>
    </div>
  );
};

const CustomPartForm = ({ onCreate }: { onCreate: (p: PartDefinition) => void }) => {
  const [name, setName] = useState("");
  const [width, setWidth] = useState(160);
  const [height, setHeight] = useState(80);
  const [terms, setTerms] = useState<Terminal[]>([]);

  return (
    <div className="rounded-md border border-border p-3 bg-background/40 space-y-3">
      <div className="text-sm font-medium">Create Custom Part</div>
      <div className="grid grid-cols-3 gap-2">
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-2" />
        <Input type="number" placeholder="Width" value={width} onChange={(e) => setWidth(Number(e.target.value))} />
        <Input type="number" placeholder="Height" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
      </div>
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Terminals</div>
        {terms.map((t, i) => (
          <TerminalRow
            key={i}
            t={t}
            onChange={(nt) => setTerms((arr) => arr.map((x, idx) => (idx === i ? nt : x)))}
            onRemove={() => setTerms((arr) => arr.filter((_, idx) => idx !== i))}
          />
        ))}
        <Button variant="secondary" size="sm" onClick={() => setTerms((arr) => [...arr, { id: "t" + (arr.length + 1), label: "T" + (arr.length + 1), type: "power+", x: 10, y: 10 }])}>Add terminal</Button>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="default" onClick={() => {
          if (!name.trim()) return;
          const key = `${slugify(name)}-${Date.now().toString(36)}`;
          onCreate({ key, name, width, height, terminals: terms });
          setName(""); setWidth(160); setHeight(80); setTerms([]);
        }}>Save Part</Button>
      </div>
    </div>
  );
};
