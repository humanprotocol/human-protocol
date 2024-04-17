import {
  Container,
  List,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/protected/page-header';
import { CheckmarkIcon, LockerIcon, ProfileIcon } from '@/components/ui/icons';
import { colorPalette } from '@/styles/color-palette';
import { Button } from '@/components/ui/button';

const mockedData = {
  email: 'johndoe@hmt.ai',
  kycCompleted: true,
  walletConnected: true,
  kycInfoOnChainAdded: true,
  notificationsConsent: false,
};

export function WorkerProfilePage() {
  const { t } = useTranslation();

  return (
    <Container maxWidth="xl">
      <PageHeader
        headerIcon={<ProfileIcon />}
        headerText={t('worker.profile.profileHeader')}
      />
      <Paper
        sx={{
          backgroundColor: colorPalette.white,
          height: '100%',
          boxShadow: 'none',
          padding: '40px',
        }}
      >
        <List>
          <ListItemText>
            <Typography
              sx={{
                marginBottom: '10px',
              }}
              variant="subtitle2"
            >
              {t('worker.profile.email')}
            </Typography>
            <Typography color={colorPalette.text.primary} variant="subtitle1">
              {mockedData.email}
            </Typography>
          </ListItemText>
          <ListItemText
            sx={{
              marginTop: '40px',
            }}
          >
            <Typography
              sx={{
                marginBottom: '10px',
              }}
              variant="subtitle2"
            >
              {t('worker.profile.password')}
            </Typography>
            <Button
              color="secondary"
              sx={{
                paddingLeft: 0,
              }}
              variant="text"
            >
              {t('worker.profile.resetPassword')}
            </Button>
          </ListItemText>
          <ListItemText>
            <Stack alignItems="center" flexDirection="row">
              <Typography
                color={
                  !mockedData.kycCompleted
                    ? colorPalette.text.secondary
                    : colorPalette.text.primary
                }
                sx={{
                  paddingLeft: 0,
                }}
                variant="subtitle2"
              >
                {t('worker.profile.kycCompleted')}
              </Typography>
              <Stack
                sx={{
                  marginLeft: '10px',
                }}
              >
                {mockedData.kycCompleted ? <CheckmarkIcon /> : <LockerIcon />}
              </Stack>
            </Stack>
          </ListItemText>
          <ListItemText>
            <Stack alignItems="center" flexDirection="row">
              <Typography
                color={
                  !mockedData.walletConnected
                    ? colorPalette.text.secondary
                    : colorPalette.text.primary
                }
                sx={{
                  paddingLeft: 0,
                }}
                variant="subtitle2"
              >
                {t('worker.profile.walletConnected')}
              </Typography>
              <Stack
                sx={{
                  marginLeft: '10px',
                }}
              >
                {mockedData.walletConnected ? (
                  <CheckmarkIcon />
                ) : (
                  <LockerIcon />
                )}
              </Stack>
            </Stack>
          </ListItemText>
          <ListItemText>
            <Stack alignItems="center" flexDirection="row">
              <Typography
                color={
                  !mockedData.kycInfoOnChainAdded
                    ? colorPalette.text.secondary
                    : colorPalette.text.primary
                }
                sx={{
                  paddingLeft: 0,
                }}
                variant="subtitle2"
              >
                {t('worker.profile.kycInfoOnChainAdded')}
              </Typography>
              <Stack
                sx={{
                  marginLeft: '10px',
                }}
              >
                {mockedData.kycInfoOnChainAdded ? (
                  <CheckmarkIcon />
                ) : (
                  <LockerIcon />
                )}
              </Stack>
            </Stack>
          </ListItemText>
        </List>
      </Paper>
    </Container>
  );
}
