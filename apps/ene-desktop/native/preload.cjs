const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld(
  "ene",
  Object.freeze({
    command: (action, value) =>
      ipcRenderer.invoke("ene:command", action, value),
    subscribe: (callback) => {
      const listener = (_event, state) => callback(state);
      ipcRenderer.on("ene:state", listener);
      ipcRenderer.invoke("ene:command", "state").then(callback);
      return () => ipcRenderer.removeListener("ene:state", listener);
    },
  }),
);
