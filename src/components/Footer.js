import React from 'react';
import { Box, Typography, Link, Divider } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 3,
        px: 2,
        backgroundColor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider'
      }}
    >
      <Divider sx={{ mb: 2 }} />
      <Typography variant="body2" color="text.secondary" align="center">
        RigRanger &copy; {new Date().getFullYear()} - Amateur Radio Remote Control Software
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center">
        <Link href="https://github.com/RigRanger" target="_blank" rel="noopener" color="inherit">
          GitHub
        </Link>
        {' | '}
        <Link href="https://github.com/RigRanger/RigRanger-Client/issues" target="_blank" rel="noopener" color="inherit">
          Report Issues
        </Link>
        {' | '}
        <Link href="https://github.com/RigRanger/RigRanger-Client/wiki" target="_blank" rel="noopener" color="inherit">
          Documentation
        </Link>
      </Typography>
    </Box>
  );
};

export default Footer;
