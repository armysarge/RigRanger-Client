const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { io } = require('socket.io-client');
const net = require('net');

// Keep a global reference of the window object to prevent it from being garbage collected
let mainWindow;
let socket;
let proxyServer;
let hamlibProxyPort = 4533; // Local port for hamlib proxy

// Determine the correct path for the frontend assets
const isDev = process.env.NODE_ENV === 'development';
const appPath = isDev
  ? 'http://localhost:3000'
  : `file://${path.join(__dirname, '../build/index.html')}`;

// Create the browser window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  // Load the app
  mainWindow.loadURL(appPath);

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // When window is closed, only hide the window on macOS
  mainWindow.on('closed', () => {
    if (process.platform !== 'darwin') {
      mainWindow = null;
    }
  });
}

// Initialize the app when Electron has finished initializing
app.whenReady().then(() => {
  createWindow();

  // On macOS, recreate the window when dock icon is clicked and no windows are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    disconnectFromServer();
    app.quit();
  }
});

// Gracefully disconnect and clean up resources when quitting
app.on('before-quit', () => {
  disconnectFromServer();
});

// Handle connections to server
ipcMain.on('connect-to-server', async (event, config) => {
  try {
    // Disconnect if already connected
    if (socket) {
      disconnectFromServer();
    }

    // Store hamlib port for proxy
    const remoteHamlibPort = config.hamlibPort || 4532;

    // Connect to server
    socket = io(`http://${config.address}:${config.port}`);

    // Handle connection events
    socket.on('connect', () => {
      console.log('Connected to server');

      // Create a Hamlib network proxy to connect to remote rigctld
      createHamlibProxy(config.address, remoteHamlibPort);

      // Update connection status
      updateConnectionStatus(true);
    });

    // Handle hamlib status updates
    socket.on('hamlib-status', (status) => {
      if (mainWindow) {
        mainWindow.webContents.send('hamlib-status', status);
      }
    });

    // Handle hamlib data
    socket.on('hamlib-data', (data) => {
      if (mainWindow) {
        mainWindow.webContents.send('hamlib-data', data);
      }
    });

    // Handle audio streams from server
    socket.on('audio-stream', (stream) => {
      // Process audio stream if needed
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      updateConnectionStatus(false);
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      updateConnectionStatus(false);
    });

  } catch (error) {
    console.error('Error connecting to server:', error);
    updateConnectionStatus(false);
  }
});

// Handle direct hamlib commands
ipcMain.on('hamlib-command', (event, data) => {
  if (socket && socket.connected) {
    socket.emit('hamlib-command', data, (response) => {
      event.reply('hamlib-response', response);
    });
  }
});

// Handle hamlib function calls
ipcMain.on('hamlib-function', (event, data) => {
  if (socket && socket.connected) {
    socket.emit('hamlib-function', data, (response) => {
      event.reply('hamlib-function-response', response);
    });
  }
});

// Handle disconnection request
ipcMain.on('disconnect-from-server', () => {
  disconnectFromServer();
});

/**
 * Create a proxy server that relays connections to the remote Hamlib rigctld
 * This allows local applications to connect to the remote radio as if it was local
 */
function createHamlibProxy(remoteAddress, remotePort) {
  try {
    // Close existing proxy if any
    if (proxyServer) {
      proxyServer.close();
      proxyServer = null;
    }

    // Create a proxy server
    proxyServer = net.createServer((clientSocket) => {
      // Connect to the remote rigctld
      const remoteSocket = new net.Socket();

      remoteSocket.connect(remotePort, remoteAddress, () => {
        console.log(`Connected to remote rigctld at ${remoteAddress}:${remotePort}`);
      });

      // Pipe data between client and remote server
      clientSocket.pipe(remoteSocket);
      remoteSocket.pipe(clientSocket);

      // Handle client socket errors
      clientSocket.on('error', (err) => {
        console.error('Client socket error:', err.message);
        remoteSocket.destroy();
      });

      // Handle remote socket errors
      remoteSocket.on('error', (err) => {
        console.error('Remote socket error:', err.message);
        clientSocket.destroy();
      });

      // Handle client disconnect
      clientSocket.on('close', () => {
        remoteSocket.destroy();
      });

      // Handle remote disconnect
      remoteSocket.on('close', () => {
        clientSocket.destroy();
      });
    });

    // Start listening on the local proxy port
    proxyServer.listen(hamlibProxyPort, '127.0.0.1', () => {
      console.log(`Hamlib proxy server listening on 127.0.0.1:${hamlibProxyPort}`);
    });

    // Handle server errors
    proxyServer.on('error', (err) => {
      console.error('Proxy server error:', err.message);

      // Try another port if the default is in use
      if (err.code === 'EADDRINUSE') {
        hamlibProxyPort++; // Try next port
        console.log(`Port ${hamlibProxyPort - 1} in use, trying ${hamlibProxyPort}`);
        createHamlibProxy(remoteAddress, remotePort);
      }
    });

    return true;
  } catch (error) {
    console.error('Error creating Hamlib proxy:', error);
    return false;
  }
}

// Disconnect from server and clean up resources
function disconnectFromServer() {
  try {
    // Close socket connection
    if (socket) {
      socket.disconnect();
      socket = null;
    }

    // Close proxy server
    if (proxyServer) {
      proxyServer.close();
      proxyServer = null;
    }

    updateConnectionStatus(false);
    console.log('Disconnected from server');
  } catch (error) {
    console.error('Error disconnecting:', error);
  }
}

// Update client with current connection status
function updateConnectionStatus(isConnected = false) {
  if (mainWindow) {
    mainWindow.webContents.send('connection-status', {
      connected: isConnected,
      hamlibProxyPort: isConnected ? hamlibProxyPort : null
    });
  }
}
