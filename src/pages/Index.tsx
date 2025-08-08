import { Toolbar } from "@/features/diagram/components/Toolbar";
import { Palette } from "@/features/diagram/components/Palette";
import { DiagramCanvas } from "@/features/diagram/components/DiagramCanvas";
import { PropertiesPanel } from "@/features/diagram/components/PropertiesPanel";
import { useState } from "react";
import { HelpModal } from "@/features/diagram/components/HelpModal";

const Index = () => {
  const [helpOpen, setHelpOpen] = useState(true);
  const [paletteVisible, setPaletteVisible] = useState(true);
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>
      <Toolbar onTogglePalette={() => setPaletteVisible((v) => !v)} paletteVisible={paletteVisible} />
      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
      <main id="main" className="flex flex-1 w-full">
        <Palette visible={paletteVisible} />
        <section aria-label="Canvas" id="diagram-root" className="flex-1 p-4">
          <h1 className="sr-only">930 CirciutPilot</h1>
          <DiagramCanvas />
        </section>
        <PropertiesPanel />
      </main>
    </div>
  );
};

export default Index;
