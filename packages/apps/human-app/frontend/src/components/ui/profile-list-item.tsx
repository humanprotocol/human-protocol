import { ListItem, ListItemText, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { CheckmarkIcon, LockerIcon } from '@/components/ui/icons';
import { Chips } from '@/components/ui/chips';
import { useColorMode } from '@/hooks/use-color-mode';

interface ProfileListItemProps {
  header: string;
  paragraph: string | string[];
  isStatusListItem?: boolean;
}

export function ProfileListItem({
  header,
  paragraph,
  isStatusListItem,
}: ProfileListItemProps) {
  const { colorPalette } = useColorMode();
  const { t } = useTranslation();

  return (
    <ListItem
      sx={{
        paddingLeft: 0,
      }}
    >
      <ListItemText>
        <Typography
          component="span"
          sx={{
            marginBottom: '10px',
            overflow: 'hidden',
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
                isStatusListItem === false
                  ? colorPalette.text.secondary
                  : colorPalette.text.primary
              }
              component="span"
              sx={{ wordBreak: 'break-all' }}
              variant="body1"
            >
              {paragraph}
            </Typography>
            {isStatusListItem === true && (
              <Stack
                sx={{
                  marginLeft: '5px',
                }}
              >
                <CheckmarkIcon />
              </Stack>
            )}
            {isStatusListItem === false && (
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
        {isStatusListItem === true && (
          <Button variant="contained">
            {t('operator.profile.about.status.statusDeactivateButton')}
          </Button>
        )}
        {isStatusListItem === false && (
          <Button variant="contained">
            {t('operator.profile.about.status.statusActivateButton')}
          </Button>
        )}
      </ListItemText>
    </ListItem>
  );
}
