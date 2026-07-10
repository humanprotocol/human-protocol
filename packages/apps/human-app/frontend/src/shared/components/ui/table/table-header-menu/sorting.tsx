import { Divider, Typography } from '@mui/material';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import { t } from 'i18next';
import { useColorMode } from '@/shared/contexts/color-mode';

interface SortingMenuProps {
  sortingOptions: { label: string; sortCallback: () => void }[];
  clear: () => void;
}

export function Sorting({ sortingOptions, clear }: SortingMenuProps) {
  const { colorPalette } = useColorMode();

  return (
    <List sx={{ padding: 0 }}>
      <Typography
        variant="body2"
        sx={{ color: colorPalette.text.secondary, p: 1 }}
      >
        {t('components.table.sort')}
      </Typography>
      {sortingOptions.map(({ label, sortCallback }) => {
        return (
          <ListItemText
            key={label}
            onClick={() => {
              sortCallback();
            }}
            sx={{ padding: '0.2rem 0.5rem', cursor: 'pointer' }}
          >
            <Typography
              variant="subtitle2"
              sx={{ color: colorPalette.primary.main }}
            >
              {label}
            </Typography>
          </ListItemText>
        );
      })}
      <Divider component="li" variant="fullWidth" />
      <ListItemText sx={{ padding: '0.5rem', cursor: 'pointer' }}>
        <Typography
          variant="buttonMedium"
          sx={{ color: colorPalette.primary.main }}
          onClick={() => {
            clear();
          }}
        >
          {t('components.table.clearBtn')}
        </Typography>
      </ListItemText>
    </List>
  );
}
