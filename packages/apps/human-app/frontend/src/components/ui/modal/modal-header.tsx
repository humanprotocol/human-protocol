import Grid from '@mui/material/Grid';
import CloseIcon from '@mui/icons-material/Close';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

interface ModalHeaderElementProps {
  isVisible: boolean;
  onClick: () => void;
}

interface ModalHeaderProps {
  closeButton?: ModalHeaderElementProps;
}

export function ModalHeader({ closeButton }: ModalHeaderProps) {
  return (
    <Grid container direction="row" justifyContent="space-between">
      <Grid item>
        {closeButton ? (
          <Grid>
            <Button
              data-testid="button-close-modal"
              onClick={closeButton.onClick}
            >
              <Box
                sx={{
                  p: '6px',
                  borderRadius: '50%',
                  display: 'flex',
                  justifySelf: 'center',
                }}
              >
                <CloseIcon fontSize="small" />
              </Box>
            </Button>
          </Grid>
        ) : null}
      </Grid>
    </Grid>
  );
}
