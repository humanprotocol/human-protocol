import { Box, Grid, Typography, styled } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { breakpoints } from '@/styles/theme';
import { routerPaths } from '@/shared/router-paths';
import { Alert } from '@/components/ui/alert';

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
  children: React.JSX.Element;
  alert?: React.JSX.Element;
  maxWidth?: string;
  backArrowPath?: string | -1;
  cancelBtnPath?: string | -1;
}

export function FormCard({
  title,
  children,
  alert,
  backArrowPath = -1,
  cancelBtnPath = routerPaths.app.path,
  maxWidth = '486px',
}: FormCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const goBack = (path: string | -1) => {
    if (typeof path === 'string') {
      navigate(path);
      return;
    }
    navigate(path);
  };

  return (
    <Grid
      container
      sx={{
        padding: '2rem 2rem 6rem 2rem',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '2rem',
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
        <Button onClick={goBack.bind(null, cancelBtnPath)}>
          <Typography variant="buttonMedium">
            {t('components.modal.header.closeBtn')}
          </Typography>
        </Button>
      </Grid>
      <Box
        sx={{
          flexGrow: 1,
          maxWidth,
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Grid container rowGap="1rem">
          <Grid item xs={1} />
          <Grid item sx={{ paddingLeft: '1rem' }} xs={11}>
            <div style={{ height: '3rem', width: '100%' }}>
              {alert ? (
                <Alert color="error" severity="error" sx={{ width: '100%' }}>
                  {alert}
                </Alert>
              ) : null}
            </div>
          </Grid>
          <Grid item xs={1}>
            <IconWrapper
              background="white"
              onClick={goBack.bind(null, backArrowPath)}
            >
              <ArrowBackIcon />
            </IconWrapper>
          </Grid>
          <Grid item sx={{ paddingLeft: '1rem' }} xs={11}>
            <Typography variant="h4">{title}</Typography>
          </Grid>
          <Grid item xs={1} />
          <Grid item sx={{ paddingLeft: '1rem' }} xs={11}>
            {children}
          </Grid>
        </Grid>
      </Box>
    </Grid>
  );
}
