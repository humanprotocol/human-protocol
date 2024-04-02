import Grid from '@mui/material/Grid';
import CloseIcon from '@mui/icons-material/Close';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { colorPalette } from '@/styles/color-palette';

interface ModalHeaderElementProps {
  isVisible: boolean;
  onClick: () => void;
}

interface ModalHeaderProps {
  breadcrumb?: ModalHeaderElementProps;
  closeButton?: ModalHeaderElementProps;
}

export function ModalHeader({ breadcrumb, closeButton }: ModalHeaderProps) {
  return (
    <Grid container direction="row" justifyContent="space-between">
      <Grid item>
        {breadcrumb ? <Breadcrumbs onClick={breadcrumb.onClick} /> : null}
      </Grid>
      <Grid item>
        {closeButton ? (
          <Grid>
            <Button
              data-testid="button-close-modal"
              onClick={closeButton.onClick}
              sx={{ color: colorPalette.black }}
            >
              <Box
                sx={{
                  p: '6px',
                  borderRadius: '50%',
                  display: 'flex',
                  justifySelf: 'center',
                  color: colorPalette.black,
                  backgroundColor: colorPalette.granite.light,
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
