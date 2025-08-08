import { useMemo, useState } from "react";
import { useDrag } from "react-dnd";
import parts from "../parts/library930.json";
import type { PartDefinition } from "@/types/diagram";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Palette = () => {
  const [q, setQ] = useState("");
  const list = useMemo(() => (parts as PartDefinition[]).filter((p) => p.name.toLowerCase().includes(q.toLowerCase())), [q]);
  return (
    <aside className="w-64 shrink-0 h-[calc(100vh-64px)] border-r border-border bg-card/50">
      <div className="p-3">
        <Input placeholder="Search parts" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <ScrollArea className="h-[calc(100vh-64px-56px)]">
        <div className="p-2 space-y-2">
          {list.map((p) => (
            <PaletteItem key={p.key} part={p} />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
};

const PaletteItem = ({ part }: { part: PartDefinition }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "PART",
    item: { partKey: part.key },
    collect: (m) => ({ isDragging: m.isDragging() }),
  }));
  return (
    <div ref={drag} className={`rounded-md border border-border p-3 bg-background/40 hover:bg-muted transition ${isDragging ? "opacity-50" : "opacity-100"}`}>
      <div className="text-sm font-medium">{part.name}</div>
      <div className="text-xs text-muted-foreground">{part.terminals.length} terminals</div>
    </div>
  );
};
