import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Tooltip } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';
import RadioIcon from '@mui/icons-material/Radio';

const Header = ({ isServer = false }) => {
  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <RadioIcon sx={{ mr: 2, fontSize: 28 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          RigRanger {isServer ? 'Server' : 'Client'}
        </Typography>

        <Box>
          <Tooltip title="Help">
            <IconButton color="inherit" aria-label="help">
              <HelpIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Settings">
            <IconButton color="inherit" aria-label="settings">
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
