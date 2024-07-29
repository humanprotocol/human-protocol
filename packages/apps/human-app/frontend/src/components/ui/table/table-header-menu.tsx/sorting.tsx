import { Divider, Typography } from '@mui/material';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import { t } from 'i18next';
import { colorPalette } from '@/styles/color-palette';

interface SortingMenuProps {
  sortingOptions: { label: string; sortCallback: () => void }[];
  clear: () => void;
}

export function Sorting({ sortingOptions, clear }: SortingMenuProps) {
  return (
    <List sx={{ padding: 0 }}>
      <Typography
        color={colorPalette.text.secondary}
        sx={{ padding: '0.5rem' }}
        variant="body2"
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
            <Typography color={colorPalette.primary.main} variant="subtitle2">
              {label}
            </Typography>
          </ListItemText>
        );
      })}
      <Divider component="li" variant="fullWidth" />
      <ListItemText sx={{ padding: '0.5rem', cursor: 'pointer' }}>
        <Typography
          color={colorPalette.primary.main}
          onClick={clear}
          variant="buttonMedium"
        >
          {t('components.table.clearBtn')}
        </Typography>
      </ListItemText>
    </List>
  );
}
