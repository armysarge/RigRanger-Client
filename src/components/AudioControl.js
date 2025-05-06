import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Slider,
  Button,
  FormControlLabel,
  Switch,
  Stack,
  Alert,
  Divider
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MicIcon from '@mui/icons-material/Mic';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

const AudioControl = ({ isConnected }) => {
  const [rxVolume, setRxVolume] = useState(70);
  const [txVolume, setTxVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isCompressorEnabled, setIsCompressorEnabled] = useState(true);
  const [isNoiseReductionEnabled, setIsNoiseReductionEnabled] = useState(true);
  const [noiseReductionLevel, setNoiseReductionLevel] = useState(3);

  return (
    <Box>
      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Connect to a RigRanger Server to control audio
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <VolumeUpIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                RX Audio (From Radio)
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <VolumeOffIcon color="action" />
                  <Slider
                    value={rxVolume}
                    onChange={(e, newValue) => setRxVolume(newValue)}
                    aria-labelledby="rx-volume-slider"
                    valueLabelDisplay="auto"
                    min={0}
                    max={100}
                    disabled={!isConnected || isMuted}
                    sx={{ mx: 2 }}
                  />
                  <VolumeUpIcon color="action" />
                  <Typography sx={{ ml: 2, minWidth: '40px' }}>
                    {rxVolume}%
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!isMuted}
                      onChange={() => setIsMuted(!isMuted)}
                      disabled={!isConnected}
                    />
                  }
                  label="RX Audio Enabled"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isNoiseReductionEnabled}
                      onChange={() => setIsNoiseReductionEnabled(!isNoiseReductionEnabled)}
                      disabled={!isConnected}
                    />
                  }
                  label="Noise Reduction"
                />
              </Grid>

              {isNoiseReductionEnabled && (
                <Grid item xs={12}>
                  <Typography id="nr-level" gutterBottom>
                    NR Level: {noiseReductionLevel}
                  </Typography>
                  <Slider
                    value={noiseReductionLevel}
                    onChange={(e, newValue) => setNoiseReductionLevel(newValue)}
                    aria-labelledby="nr-level"
                    valueLabelDisplay="auto"
                    min={1}
                    max={10}
                    step={1}
                    marks
                    disabled={!isConnected}
                  />
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MicIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                TX Audio (To Radio)
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MicOffIcon color="action" />
                  <Slider
                    value={txVolume}
                    onChange={(e, newValue) => setTxVolume(newValue)}
                    aria-labelledby="tx-volume-slider"
                    valueLabelDisplay="auto"
                    min={0}
                    max={100}
                    disabled={!isConnected || isMicMuted}
                    sx={{ mx: 2 }}
                  />
                  <MicIcon color="action" />
                  <Typography sx={{ ml: 2, minWidth: '40px' }}>
                    {txVolume}%
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!isMicMuted}
                      onChange={() => setIsMicMuted(!isMicMuted)}
                      disabled={!isConnected}
                    />
                  }
                  label="TX Audio Enabled"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isCompressorEnabled}
                      onChange={() => setIsCompressorEnabled(!isCompressorEnabled)}
                      disabled={!isConnected}
                    />
                  }
                  label="Audio Compressor"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <GraphicEqIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Audio Visualization
              </Typography>
            </Box>

            {isConnected ? (
              <Box
                sx={{
                  height: '120px',
                  bgcolor: 'background.default',
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {/* In a real app, we'd render an audio visualizer here */}
                  Audio visualizer would appear here (showing audio waveform or spectrum)
                </Typography>
              </Box>
            ) : (
              <Alert severity="info">
                Connect to a server to view audio visualization
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AudioControl;
