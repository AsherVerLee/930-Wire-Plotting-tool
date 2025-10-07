import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FolderOpen, Lightbulb, Package, Settings, Sparkles } from "lucide-react";
import { useDiagramStore } from "@/state/diagramStore";
import { loadProject, saveProject } from "@/utils/exporters";

interface LandingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LandingModal = ({ open, onOpenChange }: LandingModalProps) => {
  const { saveDto, loadDto, components, wires } = useDiagramStore();
  const hasExistingWork = components.length > 0 || wires.length > 0;

  const handleNewProject = () => {
    // Clear diagram by loading empty state
    loadDto({
      components: [],
      wires: [],
      labels: []
    });
    onOpenChange(false);
  };

  const handleLoadProject = async () => {
    const dto = await loadProject();
    if (dto) {
      loadDto(dto);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">930</span>
            </div>
            <div>
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Wire Plotting Tool
              </DialogTitle>
              <p className="text-muted-foreground text-lg">Design professional robot wiring diagrams</p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* New Project with Confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-2 hover:border-blue-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">New Project</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Start fresh with a blank canvas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Create New</Button>
                </CardContent>
              </Card>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Start New Project?</AlertDialogTitle>
                <AlertDialogDescription>
                  {hasExistingWork 
                    ? "This will clear your current work. Make sure to save your project first if you want to keep it."
                    : "This will create a fresh, empty project."
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleNewProject} className="bg-blue-600 hover:bg-blue-700">
                  {hasExistingWork ? "Clear & Start New" : "Create New Project"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Load Project */}
          <Card className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-2 hover:border-green-200" onClick={handleLoadProject}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FolderOpen className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Load Project</CardTitle>
              </div>
              <CardDescription className="text-base">
                Open an existing wiring diagram
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-green-200 hover:bg-green-50">Open File</Button>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-2 hover:border-yellow-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Lightbulb className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle className="text-xl">Quick Tips</CardTitle>
              </div>
              <CardDescription className="text-base">
                Learn the essentials in 30 seconds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• <strong>Drag</strong> parts from library to canvas</p>
                <p>• <strong>Click terminals</strong> to connect wires</p>
                <p>• <strong>Scroll</strong> to zoom, <strong>Shift+drag</strong> to pan</p>
              </div>
            </CardContent>
          </Card>

          {/* Tools & Features */}
          <Card className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-2 hover:border-purple-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Features</CardTitle>
              </div>
              <CardDescription className="text-base">
                Professional tools for FRC teams
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>✓ Auto wire routing & cleanup</p>
                <p>✓ Export PNG/PDF diagrams</p>
                <p>✓ Custom parts library</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            FRC Team 930 CircuitPilot • Built for professional robot design
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook to listen for the landing modal event
export const useLandingModal = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpenLanding = () => setOpen(true);
    window.addEventListener('open-landing', handleOpenLanding);
    return () => window.removeEventListener('open-landing', handleOpenLanding);
  }, []);

  return { open, setOpen };
};
