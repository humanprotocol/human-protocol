import { ListItem, ListItemText, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Chips } from '@/components/ui/chips';
import { Button } from '@/components/ui/button';
import { CheckmarkIcon, LockerIcon } from '@/components/ui/icons';
import { colorPalette } from '@/styles/color-palette';

interface ProfileListItemProps {
  header: string;
  paragraph: string | string[];
  buttonBoolean?: boolean;
}

export function ProfileListItem({
  header,
  paragraph,
  buttonBoolean,
}: ProfileListItemProps) {
  const { t } = useTranslation();

  return (
    <ListItem
      sx={{
        paddingLeft: 0,
      }}
    >
      <ListItemText>
        <Typography
          sx={{
            marginBottom: '10px',
          }}
          variant="subtitle2"
        >
          {header}
        </Typography>
        {Array.isArray(paragraph) ? (
          <Chips data={paragraph} />
        ) : (
          <Stack
            alignItems="center"
            direction="row"
            sx={{
              marginBottom: '10px',
            }}
          >
            <Typography
              color={
                buttonBoolean === false
                  ? colorPalette.text.secondary
                  : colorPalette.text.primary
              }
              variant="subtitle1"
            >
              {paragraph}
            </Typography>
            {buttonBoolean === true && (
              <Stack
                sx={{
                  marginLeft: '5px',
                }}
              >
                <CheckmarkIcon />
              </Stack>
            )}
            {buttonBoolean === false && (
              <Stack
                sx={{
                  marginLeft: '5px',
                }}
              >
                <LockerIcon />
              </Stack>
            )}
          </Stack>
        )}
        {buttonBoolean === true && (
          <Button variant="contained">
            {t('operator.profile.about.status.statusDeactivateButton')}
          </Button>
        )}
        {buttonBoolean === false && (
          <Button variant="contained">
            {t('operator.profile.about.status.statusActivateButton')}
          </Button>
        )}
      </ListItemText>
    </ListItem>
  );
}
