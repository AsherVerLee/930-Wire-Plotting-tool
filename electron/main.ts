import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "path";
import fs from "fs";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("save-file", async (_evt, content: string, filters) => {
  const { filePath } = await dialog.showSaveDialog({ filters });
  if (!filePath) return;
  fs.writeFileSync(filePath, content, "utf-8");
});

ipcMain.handle("open-file", async (_evt, filters) => {
  const res = await dialog.showOpenDialog({ filters, properties: ["openFile"] });
  const filePath = res.filePaths[0];
  if (!filePath) return null;
  return fs.readFileSync(filePath, "utf-8");
});

ipcMain.handle("export-png", async (_evt, dataUrl: string) => {
  const { filePath } = await dialog.showSaveDialog({ filters: [{ name: "PNG Image", extensions: ["png"] }] });
  if (!filePath) return;
  const base64 = dataUrl.split(",")[1];
  fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
});

ipcMain.handle("export-pdf", async (_evt, dataUrl: string) => {
  const { filePath } = await dialog.showSaveDialog({ filters: [{ name: "PDF", extensions: ["pdf"] }] });
  if (!filePath) return;
  const base64 = dataUrl.split(",")[1];
  fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
});
