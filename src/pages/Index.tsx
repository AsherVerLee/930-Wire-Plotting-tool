import { useState } from "react";
// import { DiagramCanvas } from "@/features/diagram/components/DiagramCanvas";
import { SimpleDiagramCanvas } from "@/components/SimpleDiagramCanvas";
import { Toolbar } from "@/features/diagram/components/Toolbar";
import { Palette } from "@/features/diagram/components/Palette";
import { PropertiesPanel } from "@/features/diagram/components/PropertiesPanel";
import { SettingsPanel } from "@/features/diagram/components/SettingsPanel";
import { HelpModal } from "@/features/diagram/components/HelpModal";
import { LandingModal, useLandingModal } from "@/features/diagram/components/LandingModal";

const Index = () => {
  const [paletteVisible, setPaletteVisible] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const { open: landingOpen, setOpen: setLandingOpen } = useLandingModal();

  const togglePalette = () => setPaletteVisible(!paletteVisible);
  const closeSettings = () => setSettingsVisible(false);

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Left Sidebar - Palette */}
      {paletteVisible && (
        <div className="w-72 border-r border-border bg-card">
          <Palette visible={paletteVisible} />
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Toolbar */}
        <div className="border-b border-border bg-card">
          <Toolbar onTogglePalette={togglePalette} paletteVisible={paletteVisible} />
        </div>
        
        {/* Canvas Area */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1">
            <SimpleDiagramCanvas paletteVisible={paletteVisible} />
          </div>
          
          {/* Right Sidebar - Properties */}
          <div className="w-80 border-l border-border bg-card">
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <PropertiesPanel />
              </div>
              {settingsVisible && (
                <div className="border-t border-border">
                  <SettingsPanel onDone={closeSettings} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Help Modal */}
      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
      
      {/* Landing Modal */}
      <LandingModal open={landingOpen} onOpenChange={setLandingOpen} />
    </div>
  );
};

export default Index;
