import { useMemo, useState, useEffect } from "react";
import { useDrag } from "react-dnd";
import parts from "../parts/library930.json";
import type { PartDefinition } from "@/types/diagram";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useDiagramStore } from "@/state/diagramStore";
import { loadCustomParts, removeCustomPart } from "../parts/customParts";

export const Palette = ({ visible = true }: { visible?: boolean }) => {
  const { setPartsLibrary } = useDiagramStore();
  const [q, setQ] = useState("");
  const [custom, setCustom] = useState<PartDefinition[]>(() => loadCustomParts());

  useEffect(() => {
    const onUpdate = () => setCustom(loadCustomParts());
    window.addEventListener('custom-parts-updated', onUpdate as any);
    return () => window.removeEventListener('custom-parts-updated', onUpdate as any);
  }, []);

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
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Your Parts</div>
                <Button size="sm" onClick={() => window.dispatchEvent(new CustomEvent('open-custom-menu'))}>New Part</Button>
              </div>
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
