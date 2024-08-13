import { Close as CloseIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Collapse,
  IconButton,
  Link as MuiLink,
} from '@mui/material';
import { useState, useEffect } from 'react';

export function BetaDisclaimer() {
  const [showWarning, setShowWarning] = useState(true);

  useEffect(() => {
    const value = localStorage.getItem('HUMAN_JOB_LAUNCHER_SHOW_WARNING');
    if (value === 'false') {
      setShowWarning(false);
    }
  }, []);

  const handleCloseWarning = () => {
    localStorage.setItem('HUMAN_JOB_LAUNCHER_SHOW_WARNING', 'false');
    setShowWarning(false);
  };

  return (
    <Collapse in={showWarning} unmountOnExit timeout={300}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 1200,
          backgroundColor: '#fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        <Alert
          severity="warning"
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleCloseWarning}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{
            height: '48px',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            '& .MuiAlert-action': {
              marginLeft: 0,
              paddingTop: 0,
            },
          }}
        >
          This is a Beta version, please contact us{' '}
          <MuiLink
            href="https://calendly.com/saqib-hmt/20min"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ fontWeight: 'bold', color: '#000' }}
          >
            here
          </MuiLink>
        </Alert>
      </Box>
    </Collapse>
  );
}
