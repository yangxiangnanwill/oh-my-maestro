import { app, BrowserWindow } from "electron";
import { join } from "node:path";

const IS_DEV = process.env.NODE_ENV === "development";

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Maestro IDE",
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (IS_DEV) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
