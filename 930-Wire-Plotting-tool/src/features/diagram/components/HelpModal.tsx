import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const HelpModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Welcome to FRC 930 Wiring Designer</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Drag parts from the left palette onto the canvas. Hold Shift (or Middle Mouse) to pan, use the mouse wheel to zoom.</p>
        <p>Click a terminal to start a connection, then click a matching terminal to complete it. CAN H to CAN H, CAN L to CAN L, Power + to Power +, etc.</p>
        <p>Use the toolbar to save/load projects and export PNG/PDF.</p>
      </div>
    </DialogContent>
  </Dialog>
);
