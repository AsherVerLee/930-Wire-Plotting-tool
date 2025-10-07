import { Toolbar } from "@/features/diagram/components/Toolbar";
import { Palette } from "@/features/diagram/components/Palette";
import { DiagramCanvas } from "@/features/diagram/components/DiagramCanvas";
import { PropertiesPanel } from "@/features/diagram/components/PropertiesPanel";
import { useEffect, useState } from "react";
import { useDiagramStore } from "@/state/diagramStore";
import { loadProject } from "@/utils/exporters";
import { SettingsPanel } from "@/features/diagram/components/SettingsPanel";
import { CustomPartMenu } from "@/features/diagram/components/CustomPartMenu";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [paletteVisible, setPaletteVisible] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [landingView, setLandingView] = useState<"home" | "settings" | "tips">("home");
  const [showCustomMenu, setShowCustomMenu] = useState(false);
  const { loadDto } = useDiagramStore();
  const autoCleanEnabled = useDiagramStore((s) => (s as any).autoCleanEnabled);
  const setAutoCleanEnabled = useDiagramStore((s) => (s as any).setAutoCleanEnabled);

  useEffect(() => {
    const onOpenLanding = () => { setShowLanding(true); setLandingView("home"); };
    const onOpenCustom = () => { setShowCustomMenu(true); };
    window.addEventListener('open-landing', onOpenLanding as any);
    window.addEventListener('open-custom-menu', onOpenCustom as any);
    return () => {
      window.removeEventListener('open-landing', onOpenLanding as any);
      window.removeEventListener('open-custom-menu', onOpenCustom as any);
    };
  }, []);

  const clearBoard = () => loadDto({ components: [], wires: [], labels: [] });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative">
      <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>
      <Toolbar onTogglePalette={() => setPaletteVisible((v) => !v)} paletteVisible={paletteVisible} />
      <main id="main" className="flex flex-1 w-full">
        <Palette visible={paletteVisible} />
        <section aria-label="Canvas" id="diagram-root" className="flex-1 p-4">
          <h1 className="sr-only">930 CircuitPilot</h1>
          <DiagramCanvas paletteVisible={paletteVisible} />
        </section>
        <PropertiesPanel />
      </main>

      {showLanding && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur animate-in fade-in duration-200">
          {/* Back button: if in a sub-view, go to home; else close overlay */}
          <Button
            variant="outline"
            size="sm"
            className="absolute top-4 left-4"
            onClick={() => {
              if (landingView !== "home") setLandingView("home");
              else setShowLanding(false);
            }}
            aria-label="Back"
          >
            ← Back
          </Button>

          <div className="max-w-3xl w-full p-8 rounded-2xl border border-border shadow bg-card/70">
            {landingView === "home" && (
              <div className="flex flex-col items-center text-center gap-6">
                <div className="flex items-center gap-3">
                  <img src="/favicon.ico" alt="Logo" className="w-10 h-10" />
                  <h1 className="text-2xl font-semibold">FRC 930 CircuitPilot</h1>
                </div>
                <div className="grid grid-cols-1 gap-3 w-full">
                  <Button
                    className="w-full"
                    onClick={() => {
                      if (confirm("Are you sure you want to start a new project? All current data will be lost.")) {
                        clearBoard();
                        setShowLanding(false);
                      }
                    }}
                  >
                    New Project
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={async () => {
                      const dto = await loadProject();
                      if (dto) loadDto(dto);
                      setShowLanding(false);
                    }}
                  >
                    Load Project
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setLandingView("settings")}>Settings</Button>
                  <Button variant="outline" className="w-full" onClick={() => setShowCustomMenu(true)}>Custom Part Maker</Button>
                  <Button variant="outline" className="w-full" onClick={() => setLandingView("tips")}>Tips</Button>
                </div>
                <p className="text-xs text-muted-foreground">Welcome! Hope you are well!</p>
              </div>
            )}

            {landingView === "settings" && (
              <SettingsPanel onDone={() => setLandingView("home")} />
            )}

            {landingView === "tips" && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <img src="/favicon.ico" alt="Logo" className="w-8 h-8" />
                  <h2 className="text-xl font-semibold">Tips</h2>
                </div>
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">Hi Hi! -AJV</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Click to add waypoints while routing; Cmd/Ctrl+Z undoes the last point; Esc cancels.</li>
                    <li>Keep parts and first/last segments snapped to the grid for the cleanest runs.</li>
                    <li>Route power first, then CAN/signal; paired lines follow the canonical wire.</li>
                    <li>Use the Cleaner toggle in the toolbar for auto-tidy while you work.</li>
                    <li>Shift+drag to pan; zoom is centered on the cursor.</li>
                  </ul>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setLandingView("home")}>Got it.</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Standalone Custom Part Designer overlay */}
      {showCustomMenu && (
        <CustomPartMenu onClose={() => setShowCustomMenu(false)} />
      )}
    </div>
  );
};

export default Index;
