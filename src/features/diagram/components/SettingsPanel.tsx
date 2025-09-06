import { useDiagramStore } from "@/state/diagramStore";

export function SettingsPanel({ onDone }: { onDone: () => void }) {
  const settings = useDiagramStore(s => (s as any).settings);
  const setSettings = useDiagramStore(s => (s as any).setSettings);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <img src="/favicon.ico" alt="Logo" className="w-8 h-8" />
        <h2 className="text-xl font-semibold">Settings</h2>
      </div>

      {/* Grid & Snap */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Grid & Snap</h3>
        <div className="grid grid-cols-2 gap-3 items-center">
          <label className="text-sm">Grid size</label>
          <input type="number" className="bg-background border border-border rounded px-2 py-1 text-sm" value={settings.gridSize}
            onChange={(e) => setSettings({ gridSize: Number(e.target.value) })} />
          <label className="text-sm">Snap strength</label>
          <input type="range" min={0} max={1} step={0.05} value={settings.snapStrength}
            onChange={(e) => setSettings({ snapStrength: Number(e.target.value) })} />
        </div>
      </section>

      {/* Router */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Router</h3>
        <div className="grid grid-cols-2 gap-3 items-center">
          <label className="text-sm">Clearance</label>
          <input type="number" className="bg-background border border-border rounded px-2 py-1 text-sm" value={settings.router.clearance}
            onChange={(e) => setSettings({ router: { ...settings.router, clearance: Number(e.target.value) } })} />
          <label className="text-sm">Escape length</label>
          <input type="number" className="bg-background border border-border rounded px-2 py-1 text-sm" value={settings.router.escapeLength}
            onChange={(e) => setSettings({ router: { ...settings.router, escapeLength: Number(e.target.value) } })} />
          <label className="text-sm">Straightness bias</label>
          <input type="number" step={0.1} className="bg-background border border-border rounded px-2 py-1 text-sm" value={settings.router.bendPenalty}
            onChange={(e) => setSettings({ router: { ...settings.router, bendPenalty: Number(e.target.value) } })} />
          <label className="text-sm">Avoid riding sensitivity</label>
          <input type="number" step={0.1} className="bg-background border border-border rounded px-2 py-1 text-sm" value={settings.router.sameDirPenalty}
            onChange={(e) => setSettings({ router: { ...settings.router, sameDirPenalty: Number(e.target.value) } })} />
        </div>
      </section>

      {/* Pair appearance */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Pair appearance</h3>
        <div className="grid grid-cols-2 gap-3 items-center">
          <label className="text-sm">Stripe spacing</label>
          <input type="number" className="bg-background border border-border rounded px-2 py-1 text-sm" value={settings.pair.stripeSpacing}
            onChange={(e) => setSettings({ pair: { ...settings.pair, stripeSpacing: Number(e.target.value) } })} />
          <label className="text-sm">Stripe thickness scale</label>
          <input type="number" step={0.1} className="bg-background border border-border rounded px-2 py-1 text-sm" value={settings.pair.stripeThicknessScale}
            onChange={(e) => setSettings({ pair: { ...settings.pair, stripeThicknessScale: Number(e.target.value) } })} />
          <label className="text-sm">Always render composite</label>
          <input type="checkbox" checked={settings.pair.alwaysComposite}
            onChange={(e) => setSettings({ pair: { ...settings.pair, alwaysComposite: e.target.checked } })} />
        </div>
      </section>

      {/* Validator */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Validator</h3>
        <div className="grid grid-cols-2 gap-3 items-center">
          <label className="text-sm">Auto-clean</label>
          <input type="checkbox" checked={settings.validator.autoCleanEnabled}
            onChange={(e) => setSettings({ validator: { ...settings.validator, autoCleanEnabled: e.target.checked } })} />
          <label className="text-sm">Clean on move</label>
          <input type="checkbox" checked={settings.validator.validateOnMove}
            onChange={(e) => setSettings({ validator: { ...settings.validator, validateOnMove: e.target.checked } })} />
          <label className="text-sm">Repair pairs on move</label>
          <input type="checkbox" checked={settings.validator.pairRepairOnMove}
            onChange={(e) => setSettings({ validator: { ...settings.validator, pairRepairOnMove: e.target.checked } })} />
        </div>
      </section>

      {/* Visuals */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Visuals</h3>
        <div className="grid grid-cols-2 gap-3 items-center">
          <label className="text-sm">Terminal radius</label>
          <input type="number" className="bg-background border border-border rounded px-2 py-1 text-sm" value={settings.visuals.terminalRadius}
            onChange={(e) => setSettings({ visuals: { ...settings.visuals, terminalRadius: Number(e.target.value) } })} />
          <label className="text-sm">Label font size</label>
          <input type="number" className="bg-background border border-border rounded px-2 py-1 text-sm" value={settings.visuals.labelFontSize}
            onChange={(e) => setSettings({ visuals: { ...settings.visuals, labelFontSize: Number(e.target.value) } })} />
        </div>
      </section>

      {/* Export */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Export</h3>
        <div className="grid grid-cols-2 gap-3 items-center">
          <label className="text-sm">DPI</label>
          <input type="number" className="bg-background border border-border rounded px-2 py-1 text-sm" value={settings.export.dpi}
            onChange={(e) => setSettings({ export: { ...settings.export, dpi: Number(e.target.value) } })} />
          <label className="text-sm">Margin</label>
          <input type="number" className="bg-background border border-border rounded px-2 py-1 text-sm" value={settings.export.margin}
            onChange={(e) => setSettings({ export: { ...settings.export, margin: Number(e.target.value) } })} />
        </div>
      </section>

      <div className="flex justify-end">
        <button className="px-4 py-2 rounded-lg border border-border hover:bg-accent" onClick={onDone}>Done</button>
      </div>
    </div>
  );
}
