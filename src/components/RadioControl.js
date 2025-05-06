import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Slider,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import TuneIcon from '@mui/icons-material/Tune';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';

// Context for the Hamlib client could be created if needed
// This is just an example, consider adding a proper context in a real implementation
const HamlibContext = React.createContext(null);

const RadioControl = ({ isConnected, hamlibClient }) => {
  const [frequency, setFrequency] = useState('14.200');
  const [band, setBand] = useState('20m');
  const [mode, setMode] = useState('USB');
  const [filter, setFilter] = useState('WIDE');
  const [power, setPower] = useState(50);
  const [rfGain, setRfGain] = useState(80);
  const [squelch, setSquelch] = useState(20);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock bands and modes
  const bands = [
    { value: '160m', label: '160m', freq: '1.900' },
    { value: '80m', label: '80m', freq: '3.500' },
    { value: '40m', label: '40m', freq: '7.200' },
    { value: '30m', label: '30m', freq: '10.125' },
    { value: '20m', label: '20m', freq: '14.200' },
    { value: '17m', label: '17m', freq: '18.100' },
    { value: '15m', label: '15m', freq: '21.300' },
    { value: '12m', label: '12m', freq: '24.900' },
    { value: '10m', label: '10m', freq: '28.500' },
    { value: '6m', label: '6m', freq: '50.125' },
    { value: '2m', label: '2m', freq: '144.200' },
    { value: '70cm', label: '70cm', freq: '432.100' }
  ];

  const modes = [
    { value: 'LSB', label: 'LSB' },
    { value: 'USB', label: 'USB' },
    { value: 'AM', label: 'AM' },
    { value: 'FM', label: 'FM' },
    { value: 'CW', label: 'CW' },
    { value: 'RTTY', label: 'RTTY' },
    { value: 'DATA', label: 'DATA' }
  ];

  const filters = [
    { value: 'WIDE', label: 'Wide', passband: 2700 },
    { value: 'MEDIUM', label: 'Medium', passband: 1800 },
    { value: 'NARROW', label: 'Narrow', passband: 500 }
  ];

  // Effects to fetch initial radio state when connected
  useEffect(() => {
    if (isConnected && hamlibClient) {
      refreshRadioState();
    }
  }, [isConnected, hamlibClient]);

  // Function to refresh radio state
  const refreshRadioState = async () => {
    if (!isConnected || !hamlibClient) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get current frequency
      const freq = await hamlibClient.getFrequency();
      setFrequency((freq / 1000000).toFixed(3)); // Convert to MHz with 3 decimal places

      // Get current mode
      const modeInfo = await hamlibClient.getMode();
      setMode(modeInfo.mode);

      // Set band based on frequency
      const freqMHz = freq / 1000000;
      let detectedBand = '20m'; // Default
      if (freqMHz < 2) detectedBand = '160m';
      else if (freqMHz < 4) detectedBand = '80m';
      else if (freqMHz < 8) detectedBand = '40m';
      else if (freqMHz < 11) detectedBand = '30m';
      else if (freqMHz < 15) detectedBand = '20m';
      else if (freqMHz < 19) detectedBand = '17m';
      else if (freqMHz < 22) detectedBand = '15m';
      else if (freqMHz < 25) detectedBand = '12m';
      else if (freqMHz < 30) detectedBand = '10m';
      else if (freqMHz < 54) detectedBand = '6m';
      else if (freqMHz < 148) detectedBand = '2m';
      else detectedBand = '70cm';
      setBand(detectedBand);

      // Set filter based on passband
      let detectedFilter = 'WIDE';
      if (modeInfo.passband < 600) detectedFilter = 'NARROW';
      else if (modeInfo.passband < 2000) detectedFilter = 'MEDIUM';
      else detectedFilter = 'WIDE';
      setFilter(detectedFilter);

      // Get PTT status
      const ptt = await hamlibClient.getPTT();
      setIsTransmitting(ptt);

      // Get RF Gain
      try {
        const rfGainValue = await hamlibClient.getLevel('RFGAIN');
        setRfGain(rfGainValue * 100); // Convert from 0-1 to 0-100
      } catch (e) {
        console.log('RF Gain not supported or error:', e);
      }

      // Get Squelch
      try {
        const sqlValue = await hamlibClient.getLevel('SQL');
        setSquelch(sqlValue * 100); // Convert from 0-1 to 0-100
      } catch (e) {
        console.log('Squelch not supported or error:', e);
      }

      // Get RF Power
      try {
        const powerValue = await hamlibClient.getLevel('RFPOWER');
        setPower(powerValue * 100); // Convert from 0-1 to 0-100
      } catch (e) {
        console.log('RF Power not supported or error:', e);
      }

    } catch (err) {
      console.error('Error fetching radio state:', err);
      setError('Failed to fetch radio state: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBandChange = async (event) => {
    const selectedBand = bands.find(b => b.value === event.target.value);
    setBand(event.target.value);

    if (selectedBand && isConnected && hamlibClient) {
      try {
        // Convert MHz to Hz for Hamlib
        const freqHz = parseFloat(selectedBand.freq) * 1000000;
        await hamlibClient.setFrequency(freqHz);
        setFrequency(selectedBand.freq);
      } catch (err) {
        console.error('Error setting frequency:', err);
        setError('Failed to set frequency: ' + err.message);
      }
    }
  };

  const handleFrequencyChange = (event) => {
    setFrequency(event.target.value);
  };

  const handleFrequencySubmit = async () => {
    if (isConnected && hamlibClient) {
      try {
        // Convert MHz to Hz for Hamlib
        const freqHz = parseFloat(frequency) * 1000000;
        await hamlibClient.setFrequency(freqHz);
      } catch (err) {
        console.error('Error setting frequency:', err);
        setError('Failed to set frequency: ' + err.message);
      }
    }
  };

  const handleModeChange = async (event) => {
    const newMode = event.target.value;
    setMode(newMode);

    if (isConnected && hamlibClient) {
      try {
        // Get passband width based on selected filter
        const filterObj = filters.find(f => f.value === filter);
        const passband = filterObj ? filterObj.passband : 0; // 0 means use default

        await hamlibClient.setMode(newMode, passband);
      } catch (err) {
        console.error('Error setting mode:', err);
        setError('Failed to set mode: ' + err.message);
      }
    }
  };

  const handleFilterChange = async (event) => {
    const newFilter = event.target.value;
    setFilter(newFilter);

    if (isConnected && hamlibClient) {
      try {
        // Get passband width based on selected filter
        const filterObj = filters.find(f => f.value === newFilter);
        const passband = filterObj ? filterObj.passband : 0; // 0 means use default

        await hamlibClient.setMode(mode, passband);
      } catch (err) {
        console.error('Error setting filter:', err);
        setError('Failed to set filter: ' + err.message);
      }
    }
  };

  const handleTransmit = async () => {
    if (isConnected && hamlibClient) {
      try {
        await hamlibClient.setPTT(!isTransmitting);
        setIsTransmitting(!isTransmitting);
      } catch (err) {
        console.error('Error setting PTT:', err);
        setError('Failed to set PTT: ' + err.message);
      }
    }
  };

  const handleRfGainChange = async (event, newValue) => {
    setRfGain(newValue);

    if (isConnected && hamlibClient) {
      try {
        // Convert from 0-100 to 0-1 for Hamlib
        await hamlibClient.setLevel('RFGAIN', newValue / 100);
      } catch (err) {
        console.error('Error setting RF Gain:', err);
      }
    }
  };

  const handleSquelchChange = async (event, newValue) => {
    setSquelch(newValue);

    if (isConnected && hamlibClient) {
      try {
        // Convert from 0-100 to 0-1 for Hamlib
        await hamlibClient.setLevel('SQL', newValue / 100);
      } catch (err) {
        console.error('Error setting Squelch:', err);
      }
    }
  };

  const handlePowerChange = async (event, newValue) => {
    setPower(newValue);

    if (isConnected && hamlibClient) {
      try {
        // Convert from 0-100 to 0-1 for Hamlib
        await hamlibClient.setLevel('RFPOWER', newValue / 100);
      } catch (err) {
        console.error('Error setting RF Power:', err);
      }
    }
  };

  return (
    <Box>
      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Connect to a RigRanger Server to control the radio
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 4,
          bgcolor: isTransmitting ? 'error.dark' : 'background.paper',
          transition: 'background-color 0.3s ease'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" sx={{ color: isTransmitting ? 'white' : 'inherit' }}>
              {frequency} MHz
            </Typography>
            <Typography variant="subtitle1" sx={{ color: isTransmitting ? 'white' : 'text.secondary' }}>
              {band} - {mode} - {filter}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color={isTransmitting ? "error" : "primary"}
                startIcon={<PowerSettingsNewIcon />}
                onClick={handleTransmit}
                disabled={!isConnected || loading}
                sx={{
                  minWidth: '120px',
                  fontWeight: 'bold',
                  backgroundColor: isTransmitting ? 'error.main' : undefined
                }}
              >
                {isTransmitting ? "TX" : "RX"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Frequency
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={8}>
                <TextField
                  fullWidth
                  label="Frequency (MHz)"
                  value={frequency}
                  onChange={handleFrequencyChange}
                  onBlur={handleFrequencySubmit}
                  disabled={!isConnected || loading}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={4}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleFrequencySubmit}
                  disabled={!isConnected || loading}
                  sx={{ height: '56px' }}
                >
                  Set
                </Button>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth disabled={!isConnected || loading}>
                  <InputLabel id="band-select-label">Band</InputLabel>
                  <Select
                    labelId="band-select-label"
                    id="band-select"
                    value={band}
                    label="Band"
                    onChange={handleBandChange}
                  >
                    {bands.map((band) => (
                      <MenuItem key={band.value} value={band.value}>
                        {band.label} ({band.freq} MHz)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Mode & Filter
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth disabled={!isConnected || loading}>
                  <InputLabel id="mode-select-label">Mode</InputLabel>
                  <Select
                    labelId="mode-select-label"
                    id="mode-select"
                    value={mode}
                    label="Mode"
                    onChange={handleModeChange}
                  >
                    {modes.map((mode) => (
                      <MenuItem key={mode.value} value={mode.value}>
                        {mode.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth disabled={!isConnected || loading}>
                  <InputLabel id="filter-select-label">Filter</InputLabel>
                  <Select
                    labelId="filter-select-label"
                    id="filter-select"
                    value={filter}
                    label="Filter"
                    onChange={handleFilterChange}
                  >
                    {filters.map((filter) => (
                      <MenuItem key={filter.value} value={filter.value}>
                        {filter.label} ({filter.passband} Hz)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Controls
            </Typography>

            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Typography gutterBottom>RF Gain</Typography>
                <Slider
                  value={rfGain}
                  onChange={handleRfGainChange}
                  aria-labelledby="rf-gain-slider"
                  valueLabelDisplay="auto"
                  disabled={!isConnected || loading}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography gutterBottom>Squelch</Typography>
                <Slider
                  value={squelch}
                  onChange={handleSquelchChange}
                  aria-labelledby="squelch-slider"
                  valueLabelDisplay="auto"
                  disabled={!isConnected || loading}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography gutterBottom>Power</Typography>
                <Slider
                  value={power}
                  onChange={handlePowerChange}
                  aria-labelledby="power-slider"
                  valueLabelDisplay="auto"
                  disabled={!isConnected || loading}
                  color="error"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress />
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          variant="outlined"
          startIcon={<TuneIcon />}
          onClick={refreshRadioState}
          disabled={!isConnected || loading}
        >
          Refresh Radio State
        </Button>
      </Box>
    </Box>
  );
};

export default RadioControl;
