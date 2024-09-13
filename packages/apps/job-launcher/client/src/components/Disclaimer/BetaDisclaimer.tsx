import { Alert, Box, Collapse, Link as MuiLink } from '@mui/material';

export function BetaDisclaimer() {
  return (
    <Collapse in={true} timeout={300}>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          zIndex: 1200,
          backgroundColor: '#fff',
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        <Alert
          severity="warning"
          sx={{
            height: '30px',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            '& .MuiAlert-action': {
              marginLeft: 0,
              paddingTop: 0,
            },
          }}
        >
          This is a Beta version, to get a walkthrough please contact us{' '}
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
