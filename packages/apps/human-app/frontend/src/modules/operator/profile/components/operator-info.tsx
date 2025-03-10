import { Paper, Typography, Stack, List, Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useWeb3AuthenticatedUser } from '@/modules/auth-web3/hooks/use-web3-authenticated-user';
import { CheckmarkIcon, LockerIcon } from '@/shared/components/ui/icons';
import { ProfileListItem } from '@/shared/components/ui/profile';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { type GetEthKVStoreValuesSuccessResponse } from '../../hooks/use-get-keys';
import { ProfileDisableButton } from './profile-disable-button';
import { ProfileEnableButton } from './profile-enable-button';

export function OperatorInfo({
  keysData,
}: Readonly<{ keysData: GetEthKVStoreValuesSuccessResponse }>) {
  const { colorPalette } = useColorMode();
  const { t } = useTranslation();
  const { user } = useWeb3AuthenticatedUser();
  const isMobile = useIsMobile('lg');

  const isOperatorActive = user.status === 'active';

  return (
    <Paper
      sx={{
        height: '100%',
        boxShadow: 'none',
        padding: isMobile ? '40px 20px' : '40px 40px',
        borderRadius: '20px',
      }}
    >
      <Typography
        color={colorPalette.text.primary}
        sx={{
          fontWeight: 600,
        }}
        variant="h5"
      >
        {t('operator.profile.about.header')}
      </Typography>
      <Stack flexDirection="row">
        <List sx={{ overflow: 'hidden' }}>
          <ProfileListItem
            header={t('operator.profile.about.role')}
            paragraph={
              keysData.role ?? t('operator.addKeysPage.existingKeys.noValue')
            }
          />
          <Grid
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <Typography
              component="span"
              sx={{
                overflow: 'hidden',
              }}
              variant="subtitle2"
            >
              {t('operator.profile.about.status.statusHeader')}
            </Typography>
            {isOperatorActive ? (
              <Grid
                sx={{
                  display: 'flex',

                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {t('operator.profile.about.status.statusActivated')}
                <CheckmarkIcon />
              </Grid>
            ) : (
              <Grid
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {t('operator.profile.about.status.statusDeactivated')}
                <LockerIcon />
              </Grid>
            )}
            <div>
              {isOperatorActive ? (
                <ProfileDisableButton />
              ) : (
                <ProfileEnableButton />
              )}
            </div>
          </Grid>
          <ProfileListItem
            header={t('operator.profile.about.fee')}
            paragraph={
              `${keysData.fee ?? ''}${t('inputMasks.percentSuffix')}` ||
              t('operator.addKeysPage.existingKeys.noValue')
            }
          />
          <ProfileListItem
            header={t('operator.profile.about.publicKey')}
            paragraph={
              keysData.public_key ??
              t('operator.addKeysPage.existingKeys.noValue')
            }
          />
          <ProfileListItem
            header={t('operator.profile.about.url')}
            paragraph={
              keysData.url ?? t('operator.addKeysPage.existingKeys.url')
            }
          />
          <ProfileListItem
            header={t('operator.profile.about.webhookUrl')}
            paragraph={
              keysData.webhook_url ??
              t('operator.addKeysPage.existingKeys.noValue')
            }
          />
        </List>
      </Stack>
    </Paper>
  );
}
