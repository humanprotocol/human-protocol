import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ModalHeaderElementProps {
  isVisible: boolean;
  onClick: () => void;
}

interface ModalHeaderProps {
  closeButton?: ModalHeaderElementProps;
}

export function ModalHeader({ closeButton }: Readonly<ModalHeaderProps>) {
  const { t } = useTranslation();
  return (
    <Grid
      container
      direction="row"
      justifyContent="flex-end"
      width="100%"
      padding="16px"
    >
      <Grid item>
        {closeButton?.isVisible && (
          <Grid>
            <Button
              data-testid="button-close-modal"
              onClick={closeButton.onClick}
              variant="text"
            >
              <Typography variant="buttonMedium">
                {t('components.modal.header.closeBtn')}
              </Typography>
            </Button>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
}
