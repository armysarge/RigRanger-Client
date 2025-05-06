const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    send: (channel, data) => {
      // Whitelist channels
      const validChannels = [
        'connect-to-server',
        'disconnect-from-server',
        'hamlib-command',
        'hamlib-function'
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel, func) => {
      // Whitelist channels
      const validChannels = [
        'connection-status',
        'hamlib-status',
        'hamlib-data',
        'hamlib-response',
        'hamlib-function-response'
      ];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    }
  }
);
