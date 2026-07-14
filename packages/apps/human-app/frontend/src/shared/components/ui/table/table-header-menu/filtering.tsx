import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import { t } from 'i18next';
import { useColorMode } from '@/shared/contexts/color-mode';

interface FilteringOption<T> {
  name: string;
  option: T;
}

interface FilteringProps<T> {
  filteringOptions: FilteringOption<T>[];
  isChecked: (option: T) => boolean;
  setFiltering: (option: T) => void;
  clear: () => void;
  showTitle?: boolean;
  showClearButton?: boolean;
}

export function Filtering<T>({
  filteringOptions,
  isChecked,
  setFiltering,
  clear,
  showTitle = false,
  showClearButton = false,
}: Readonly<FilteringProps<T>>) {
  const { colorPalette } = useColorMode();

  return (
    <List sx={{ padding: 0 }}>
      {showTitle ? (
        <Typography
          variant="body2"
          sx={{ color: colorPalette.text.secondary, p: 1 }}
        >
          {t('components.table.filter')}
        </Typography>
      ) : null}
      {filteringOptions.map(({ option, name }) => {
        return (
          <ListItem component="span" key={name} sx={{ padding: '0 0.5rem' }}>
            <Checkbox
              checked={isChecked(option)}
              name={name}
              onClick={() => {
                if (isChecked(option)) {
                  clear();
                  return;
                }
                setFiltering(option);
              }}
              sx={{ pl: 0, ':hover': { background: 'none' } }}
            />
            <ListItem
              component="span"
              sx={{
                pl: 0,
              }}
            >
              <Typography
                variant="body1"
                sx={{ color: colorPalette.primary.main }}
              >
                {name}
              </Typography>
            </ListItem>
          </ListItem>
        );
      })}
      {showClearButton ? (
        <>
          <Divider component="li" variant="fullWidth" />
          <ListItem sx={{ padding: '0.5rem', cursor: 'pointer' }}>
            <Typography
              variant="buttonMedium"
              sx={{ color: colorPalette.primary.main }}
              onClick={() => {
                clear();
              }}
            >
              {t('components.table.clearBtn')}
            </Typography>
          </ListItem>
        </>
      ) : null}
    </List>
  );
}
