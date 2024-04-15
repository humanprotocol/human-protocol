import { Grid, Stack, Typography, styled } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { breakpoints } from '@/styles/theme';

const IconWrapper = styled('div')<{ background: string }>(({ background }) => ({
  width: '40px',
  height: '40px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background,
  borderRadius: '50%',
  cursor: 'pointer',
  ':hover': {
    cursor: 'pointer',
  },
}));

interface FormCardProps {
  title: string;
  children: React.ReactElement | React.JSX.Element;
  maxWidth?: string;
}

export function FormCard({
  title,
  children,
  maxWidth = '486px',
}: FormCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const goBack = () => {
    navigate(-1);
  };

  return (
    <Grid
      container
      sx={{
        padding: '20px',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '20px',
        maxWidth: '1200px',
        width: '100%',
        background: 'whitesmoke',
        [breakpoints.mobile]: {
          borderRadius: '0',
        },
      }}
    >
      <Grid sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <Button onClick={goBack}>
          <Typography variant="buttonMedium">
            {t('components.modal.header.closeBtn')}
          </Typography>
        </Button>
      </Grid>
      <Stack
        maxWidth={maxWidth}
        sx={{ justifyContent: 'center', alignItems: 'center' }}
        width="100%"
      >
        <Grid
          container
          sx={{
            flexWrap: 'nowrap',
            gap: '1rem',
          }}
        >
          <IconWrapper background="white" onClick={goBack}>
            <ArrowBackIcon />
          </IconWrapper>
          <Grid container gap="2rem" width="100%">
            <Typography variant="h4">{title}</Typography>
            {children}
          </Grid>
        </Grid>
      </Stack>
    </Grid>
  );
}
