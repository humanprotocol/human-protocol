import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import { useTranslation } from 'react-i18next';
import { useTableQuery } from '@/components/ui/table/table-query-hook';
import { colorPalette } from '@/styles/color-palette';

export interface FilteringOption {
  text: string;
  value: string;
}

interface FilteringProps {
  label: string;
  filteringOptions: FilteringOption[];
}

export function Filtering({ label, filteringOptions }: FilteringProps) {
  const {
    actions: { setFiltering },
    fields: { filtering },
  } = useTableQuery();
  const { t } = useTranslation();

  const isChecked = (currentFilter: string) =>
    Boolean(filtering.includes(currentFilter));

  return (
    <List sx={{ padding: 0 }}>
      <ListItem component="span" sx={{ padding: '0.5rem' }}>
        <Typography>{label}</Typography>
      </ListItem>
      {filteringOptions.map(({ value, text }) => {
        return (
          <ListItem component="span" key={text} sx={{ padding: '0.5rem' }}>
            <Checkbox
              checked={isChecked(value)}
              name={text}
              onClick={() => {
                setFiltering((prevFilters) => {
                  if (isChecked(value)) {
                    return prevFilters.filter((filter) => filter !== value);
                  }
                  return [...prevFilters, value];
                });
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
                {text}
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
            setFiltering((prevFilters) => {
              return prevFilters.filter(
                (filter) =>
                  !filteringOptions.find(({ value }) => {
                    return value === filter;
                  })
              );
            });
          }}
          variant="button"
        >
          {t('components.table.clearBtn')}
        </Typography>
      </ListItem>
    </List>
  );
}
