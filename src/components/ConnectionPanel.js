import React from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  Alert,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import DevicesIcon from '@mui/icons-material/Devices';
import SettingsInputComponentIcon from '@mui/icons-material/SettingsInputComponent';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';

const ConnectionPanel = ({
  serverAddress,
  serverPort,
  hamlibPort = 4532,
  onChangeAddress,
  onChangePort,
  onChangeHamlibPort,
  isConnected,
  onConnect,
  onDisconnect,
  hamlibStatus
}) => {
  // Status chip color based on connection status
  const getStatusColor = () => {
    if (!hamlibStatus) return 'default';

    switch (hamlibStatus.status) {
      case 'connected':
        return 'success';
      case 'disconnected':
        return 'default';
      case 'error':
        return 'error';
      case 'reconnecting':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Server Connection
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            label="Server Address"
            value={serverAddress}
            onChange={(e) => onChangeAddress(e.target.value)}
            disabled={isConnected}
            placeholder="Enter IP address or hostname"
            helperText="IP address or hostname of the RigRanger Server"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Server Port"
            type="number"
            value={serverPort}
            onChange={(e) => onChangePort(parseInt(e.target.value, 10))}
            disabled={isConnected}
            inputProps={{
              min: 1024,
              max: 65535
            }}
            helperText="Server port (default: 8080)"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Hamlib Network Port"
            type="number"
            value={hamlibPort}
            onChange={(e) => onChangeHamlibPort(parseInt(e.target.value, 10))}
            disabled={isConnected}
            inputProps={{
              min: 1024,
              max: 65535
            }}
            helperText="Hamlib rigctld port (default: 4532)"
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            color={isConnected ? "error" : "success"}
            startIcon={isConnected ? <StopIcon /> : <PlayArrowIcon />}
            onClick={isConnected ? onDisconnect : onConnect}
            size="large"
            fullWidth
            sx={{ py: 1.5 }}
            disabled={!isConnected && (!serverAddress || !serverPort)}
          >
            {isConnected ? "Disconnect" : "Connect"}
          </Button>
        </Grid>
      </Grid>

      {hamlibStatus && (
        <>
          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Hamlib Status
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <NetworkCheckIcon sx={{ mr: 1, color: getStatusColor() === 'success' ? 'success.main' : 'text.secondary' }} />
                  <Typography variant="subtitle1">
                    Hamlib Network Connection
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                  Status of the Hamlib network connection to the radio.
                </Typography>
                <Chip
                  label={hamlibStatus.message || hamlibStatus.status}
                  color={getStatusColor()}
                  size="medium"
                  variant="outlined"
                />
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default ConnectionPanel;
