import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import type { DiagramStateDto } from "@/types/diagram";

export async function exportPNG(el: HTMLElement, dpi = 192) {
  const scale = (dpi / 96) * window.devicePixelRatio;
  const dataUrl = await toPng(el, {
    pixelRatio: scale,
    backgroundColor: "#0b1220",
    quality: 1,
  });

  if (window.electronAPI?.exportPNG) {
    await window.electronAPI.exportPNG(dataUrl);
  } else {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `diagram.png`;
    a.click();
  }
}

export async function exportPDF(el: HTMLElement, dpi = 192) {
  const scale = (dpi / 96) * window.devicePixelRatio;
  const dataUrl = await toPng(el, {
    pixelRatio: scale,
    backgroundColor: "#0b1220",
  });
  const img = new Image();
  await new Promise((res) => {
    img.onload = res;
    img.src = dataUrl;
  });
  const pdf = new jsPDF({ orientation: img.width > img.height ? "l" : "p", unit: "pt", format: [img.width, img.height] });
  pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);

  if (window.electronAPI?.exportPDF) {
    await window.electronAPI.exportPDF(pdf.output("datauristring"));
  } else {
    pdf.save("diagram.pdf");
  }
}

export async function saveProject(dto: DiagramStateDto) {
  const json = JSON.stringify(dto, null, 2);
  if (window.electronAPI?.saveFile) {
    await window.electronAPI.saveFile(json, [{ name: "Wiring Project", extensions: ["json"] }]);
    return;
  }
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wiring-project.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function loadProject(): Promise<DiagramStateDto | null> {
  if (window.electronAPI?.openFile) {
    const content = await window.electronAPI.openFile([{ name: "Wiring Project", extensions: ["json"] }]);
    if (!content) return null;
    return JSON.parse(content) as DiagramStateDto;
  }
  return new Promise((resolve) => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".json";
    inp.onchange = async () => {
      const file = inp.files?.[0];
      if (!file) return resolve(null);
      const text = await file.text();
      resolve(JSON.parse(text));
    };
    inp.click();
  });
}
