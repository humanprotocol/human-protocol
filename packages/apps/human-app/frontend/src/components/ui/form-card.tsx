import { Box, Grid, Typography, styled } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { breakpoints } from '@/styles/theme';
import { routerPaths } from '@/shared/router-paths';
import { Alert } from '@/components/ui/alert';

const IconWrapper = styled('div')(() => ({
  width: '40px',
  height: '40px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
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
  cardMaxWidth?: string;
  childrenMaxWidth?: string;
  backArrowPath?: string | -1;
  cancelBtnPath?: string | -1;
}

export function FormCard({
  title,
  children,
  alert,
  cardMaxWidth = '1200px',
  childrenMaxWidth = '486px',
  backArrowPath = -1,
  cancelBtnPath = routerPaths.app.path,
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
        maxWidth: cardMaxWidth,
        width: '100%',
        background: 'whitesmoke',
        [breakpoints.mobile]: {
          borderRadius: '0',
        },
      }}
    >
      <Grid
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          width: '100%',
          [breakpoints.mobile]: {
            display: 'none',
          },
        }}
      >
        <Button onClick={goBack.bind(null, cancelBtnPath)}>
          <Typography variant="buttonMedium">
            {t('components.modal.header.closeBtn')}
          </Typography>
        </Button>
      </Grid>
      <Box
        sx={{
          flexGrow: 1,
          maxWidth: childrenMaxWidth,
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Grid
          container
          sx={{
            rowGap: '1rem',
            [breakpoints.mobile]: {
              rowGap: '0.4rem',
            },
          }}
        >
          <Grid
            sx={{
              display: 'none',
              [breakpoints.mobile]: {
                display: 'flex',
                width: '100%',
                justifyContent: 'space-between',
              },
            }}
          >
            <IconWrapper onClick={goBack.bind(null, backArrowPath)}>
              <ArrowBackIcon />
            </IconWrapper>
            <Button onClick={goBack.bind(null, cancelBtnPath)}>
              <Typography variant="buttonMedium">
                {t('components.modal.header.closeBtn')}
              </Typography>
            </Button>
          </Grid>
          <Grid item md={1} order={{ xs: 3, md: 1 }} xs={12} />
          <Grid
            item
            md={11}
            order={{ xs: 2, md: 2 }}
            sx={{
              height: '3rem',
              width: '100%',
              [breakpoints.mobile]: {
                height: 'auto',
              },
            }}
            xs={12}
          >
            {alert ? (
              <Alert color="error" severity="error" sx={{ width: '100%' }}>
                {alert}
              </Alert>
            ) : null}
          </Grid>
          <Grid
            item
            md={1}
            order={{ xs: 1, md: 3 }}
            sx={{
              [breakpoints.mobile]: {
                display: 'none',
              },
            }}
            xs={12}
          >
            <IconWrapper onClick={goBack.bind(null, backArrowPath)}>
              <ArrowBackIcon />
            </IconWrapper>
          </Grid>
          <Grid item md={11} order={{ xs: 4, md: 4 }} xs={12}>
            <Typography variant="h4">{title}</Typography>
          </Grid>
          <Grid item md={1} order={{ xs: 5, md: 5 }} xs={1} />
          <Grid item md={11} order={{ xs: 6, md: 6 }} xs={12}>
            {children}
          </Grid>
        </Grid>
      </Box>
    </Grid>
  );
}
