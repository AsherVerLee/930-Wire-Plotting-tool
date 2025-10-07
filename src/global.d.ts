export {};

declare global {
  interface Window {
    electronAPI?: {
      saveFile?: (content: string, filters?: { name: string; extensions: string[] }[]) => Promise<void>;
      openFile?: (filters?: { name: string; extensions: string[] }[]) => Promise<string | null>;
      exportPNG?: (dataUrl: string) => Promise<void>;
      exportPDF?: (dataUrlOrPdf: string) => Promise<void>;
    };
  }
}
