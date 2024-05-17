import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import { t } from 'i18next';
import { colorPalette } from '@/styles/color-palette';

interface FilteringOption<T> {
  name: string;
  option: T;
}

interface FilteringProps<T> {
  filteringOptions: FilteringOption<T>[];
  isChecked: (option: T) => boolean;
  setFiltering: (option: T) => void;
  clear: () => void;
}

export function Filtering<T>({
  filteringOptions,
  isChecked,
  setFiltering,
  clear,
}: FilteringProps<T>) {
  return (
    <List sx={{ padding: 0 }}>
      <Typography
        color={colorPalette.text.secondary}
        sx={{ padding: '0.5rem' }}
        variant="body2"
      >
        {t('components.table.filter')}
      </Typography>
      {filteringOptions.map(({ option, name }) => {
        return (
          <ListItem component="span" key={name} sx={{ padding: '0 0.5rem' }}>
            <Checkbox
              checked={isChecked(option)}
              name={name}
              onClick={() => {
                setFiltering(option);
              }}
              sx={{ paddingLeft: 0, ':hover': { background: 'none' } }}
            />
            <ListItem
              component="span"
              sx={{
                paddingLeft: 0,
              }}
            >
              <Typography color={colorPalette.primary.main} variant="body1">
                {name}
              </Typography>
            </ListItem>
          </ListItem>
        );
      })}
      <Divider component="li" variant="fullWidth" />
      <ListItem sx={{ padding: '0.5rem', cursor: 'pointer' }}>
        <Typography
          color={colorPalette.primary.main}
          onClick={() => {
            clear();
          }}
          variant="buttonMedium"
        >
          {t('components.table.clearBtn')}
        </Typography>
      </ListItem>
    </List>
  );
}
