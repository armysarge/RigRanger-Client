import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Stack,
  Grid
} from '@mui/material';
import SignalWifiStatusbar4BarIcon from '@mui/icons-material/SignalWifiStatusbar4Bar';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import DevicesIcon from '@mui/icons-material/Devices';

const ConnectionStatus = ({ isServer = false, isRunning = false, connectedClients = 0, connectedToHost = false, serverAddress = '' }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        mb: 4,
        bgcolor: isRunning || connectedToHost ? 'success.dark' : 'error.dark',
        color: 'white'
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          {isRunning || connectedToHost ? (
            <SignalWifiStatusbar4BarIcon sx={{ fontSize: 40 }} />
          ) : (
            <SignalWifiOffIcon sx={{ fontSize: 40 }} />
          )}
        </Grid>

        <Grid item xs>
          <Typography variant="h6" component="div" gutterBottom>
            {isServer ? (
              isRunning ? "Server Running" : "Server Stopped"
            ) : (
              connectedToHost ? "Connected to Host" : "Disconnected"
            )}
          </Typography>

          {isServer ? (
            <Box>
              {isRunning ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <DevicesIcon fontSize="small" />
                  <Typography variant="body1">
                    {connectedClients} {connectedClients === 1 ? 'client' : 'clients'} connected
                  </Typography>
                </Stack>
              ) : (
                <Typography variant="body2">
                  Start the server to make your radio accessible over the network
                </Typography>
              )}
            </Box>
          ) : (
            <Box>
              {connectedToHost ? (
                <Typography variant="body2">
                  Connected to server at {serverAddress}
                </Typography>
              ) : (
                <Typography variant="body2">
                  Enter the server address and port to connect
                </Typography>
              )}
            </Box>
          )}
        </Grid>

        <Grid item>
          <Chip
            label={isServer ? (isRunning ? "Active" : "Inactive") : (connectedToHost ? "Connected" : "Disconnected")}
            color={isRunning || connectedToHost ? "success" : "error"}
            sx={{
              color: 'white',
              bgcolor: isRunning || connectedToHost ? 'success.light' : 'error.light',
              fontWeight: 'bold'
            }}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ConnectionStatus;
