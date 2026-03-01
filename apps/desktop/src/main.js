const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const Store = require("electron-store");

const store = new Store();
const isDev = process.env.NODE_ENV === "development";

let mainWindow = null;
let isOnline = true;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    titleBarStyle: "hiddenInset",
    show: false,
  });

  // Load Next.js web app
  const webUrl = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "../web/.next/server/app/page.html")}`;

  mainWindow.loadURL(webUrl);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

// Online/offline detection
app.on("ready", () => {
  createWindow();

  // Ping to check connectivity
  setInterval(async () => {
    try {
      const { net } = require("electron");
      isOnline = net.isOnline();
      mainWindow?.webContents.send("connectivity-change", isOnline);
    } catch {
      isOnline = false;
    }
  }, 5000);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC handlers for Electron-specific features
ipcMain.handle("get-connectivity", () => isOnline);
ipcMain.handle("get-app-version", () => app.getVersion());
ipcMain.handle("store-get", (_, key) => store.get(key));
ipcMain.handle("store-set", (_, key, value) => store.set(key, value));

// SQLite sync status
ipcMain.handle("get-sync-status", () => {
  return store.get("sync-status", { lastSync: null, pending: 0 });
});
