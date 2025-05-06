import React, { useState, useEffect } from 'react';
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  Container,
  Box,
  Typography,
  Paper,
  Divider,
  Tab,
  Tabs
} from '@mui/material';
import Header from './components/Header';
import ConnectionPanel from './components/ConnectionPanel';
import RadioControl from './components/RadioControl';
import AudioControl from './components/AudioControl';
import ConnectionStatus from './components/ConnectionStatus';
import Footer from './components/Footer';
import HamlibClient from './utils/hamlib-client';

// Create theme with dark and light mode support
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3a86ff',
    },
    secondary: {
      main: '#fb5607',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [serverAddress, setServerAddress] = useState('');
  const [serverPort, setServerPort] = useState(8080);
  const [hamlibPort, setHamlibPort] = useState(4532);
  const [activeTab, setActiveTab] = useState(0);
  const [hamlibClient, setHamlibClient] = useState(null);
  const [hamlibStatus, setHamlibStatus] = useState({ status: 'disconnected' });
  const [radioInfo, setRadioInfo] = useState(null);

  useEffect(() => {
    // Initialize Hamlib client
    const client = new HamlibClient();
    setHamlibClient(client);

    client.on('status', (status) => {
      setHamlibStatus(status);
      setIsConnected(status.status === 'connected');
    });

    // Check if we're running in Electron
    if (window.electron) {
      document.title = 'RigRanger Client';

      // Listen for connection status updates
      window.electron.receive('connection-status', (status) => {
        setIsConnected(status.connected);
      });

      // Listen for Hamlib status updates
      window.electron.receive('hamlib-status', (status) => {
        setHamlibStatus(status);
      });
    }

    // Cleanup on unmount
    return () => {
      if (client) {
        client.disconnect();
      }
    };
  }, []);

  const handleConnect = () => {
    if (hamlibClient) {
      hamlibClient.disconnect();
      hamlibClient.connect(serverAddress, hamlibPort)
        .then(() => {
          // Once connected, get radio info
          return hamlibClient.getInfo();
        })
        .then((info) => {
          setRadioInfo(info);
        })
        .catch((error) => {
          console.error('Connection error:', error);
        });
    }

    if (window.electron) {
      window.electron.send('connect-to-server', {
        address: serverAddress,
        port: serverPort,
        hamlibPort: hamlibPort
      });
    }
  };

  const handleDisconnect = () => {
    if (hamlibClient) {
      hamlibClient.disconnect();
    }

    if (window.electron) {
      window.electron.send('disconnect-from-server');
    }

    setIsConnected(false);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.default',
        }}
      >
        <Header isServer={false} />

        <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            RigRanger Client
          </Typography>

          <Typography variant="body1" paragraph>
            Connect to your remote radio and control it as if it were directly connected to your computer.
          </Typography>

          <Box sx={{ my: 4 }}>
            <ConnectionStatus
              isServer={false}
              connectedToHost={isConnected}
              serverAddress={serverAddress && serverPort ? `${serverAddress}:${serverPort}` : ''}
              hamlibStatus={hamlibStatus}
            />
          </Box>

          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <ConnectionPanel
              serverAddress={serverAddress}
              serverPort={serverPort}
              hamlibPort={hamlibPort}
              onChangeAddress={setServerAddress}
              onChangePort={setServerPort}
              onChangeHamlibPort={setHamlibPort}
              isConnected={isConnected}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              hamlibStatus={hamlibStatus}
            />
          </Paper>

          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="radio control tabs">
                <Tab label="Radio Control" id="tab-0" aria-controls="tabpanel-0" />
                <Tab label="Audio Control" id="tab-1" aria-controls="tabpanel-1" />
              </Tabs>
            </Box>

            <Box
              role="tabpanel"
              hidden={activeTab !== 0}
              id="tabpanel-0"
              aria-labelledby="tab-0"
            >
              {activeTab === 0 && <RadioControl isConnected={isConnected} hamlibClient={hamlibClient} />}
            </Box>

            <Box
              role="tabpanel"
              hidden={activeTab !== 1}
              id="tabpanel-1"
              aria-labelledby="tab-1"
            >
              {activeTab === 1 && <AudioControl isConnected={isConnected} />}
            </Box>
          </Paper>
        </Container>

        <Footer />
      </Box>
    </ThemeProvider>
  );
};

export default App;
