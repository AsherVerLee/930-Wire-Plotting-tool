import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  saveFile: (content: string, filters?: { name: string; extensions: string[] }[]) => ipcRenderer.invoke("save-file", content, filters),
  openFile: (filters?: { name: string; extensions: string[] }[]) => ipcRenderer.invoke("open-file", filters),
  exportPNG: (dataUrl: string) => ipcRenderer.invoke("export-png", dataUrl),
  exportPDF: (dataUrl: string) => ipcRenderer.invoke("export-pdf", dataUrl),
});
