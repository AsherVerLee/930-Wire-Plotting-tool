import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "path";
import fs from "fs";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false, // This paises the window until ready-to-show event
    icon: path.join(__dirname, "../assets/icon.png"), // Add app icon
    titleBarStyle: 'default',
    title: '930 CircuitPilot',
  });

  // Show window when ready to prevent the white transiotion blo
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // Open dev tools in development
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built React app
    // main.cjs lives in dist/electron at runtime, index.html is at dist/index.html
    const indexPath = path.join(__dirname, "../index.html");
    console.log('Loading from:', indexPath);
    console.log('File exists:', fs.existsSync(indexPath));
    console.log('Current directory:', __dirname);
    
    // Always open dev tools to debug the issue
    mainWindow.webContents.openDevTools();
    
    mainWindow.loadFile(indexPath).catch((error) => {
      console.error('Failed to load file:', error);
      // Fallback: try to load a simple HTML page
      mainWindow?.loadURL('data:text/html,<h1>Error loading app</h1><p>Path: ' + indexPath + '</p>');
    });
  }

  // Add error handling
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    // Try to show helpful error
    mainWindow?.loadURL('data:text/html,<h1>Load Error</h1><p>Error: ' + errorDescription + '</p><p>Code: ' + errorCode + '</p>');
  });
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
