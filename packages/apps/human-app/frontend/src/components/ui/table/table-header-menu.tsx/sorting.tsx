import { Divider, Typography } from '@mui/material';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import { useTranslation } from 'react-i18next';
import { useTableQuery } from '@/components/ui/table/table-query-hook';
import { colorPalette } from '@/styles/color-palette';

export type Sort = 'DESC' | 'ASC';

export interface SortingOption {
  sort: Sort;
  text: string;
}

interface SortingMenuProps {
  label: string;
  columnId: string;
  sortingOption: SortingOption[];
}

export function Sorting({ sortingOption, columnId, label }: SortingMenuProps) {
  const {
    actions: { setSorting },
  } = useTableQuery();
  const { t } = useTranslation();

  const clear = () => {
    setSorting((prev) => prev.filter(({ id }) => id !== columnId));
  };

  const handleSorting = (selectedSorting: Sort) => {
    setSorting((prev) => {
      const prevSorting = prev.filter(({ id }) => id !== columnId);

      return [
        ...prevSorting,
        { id: columnId, desc: selectedSorting === 'DESC' },
      ];
    });
  };

  return (
    <List sx={{ padding: 0 }}>
      <ListItemText primary={label} sx={{ padding: '0.5rem' }}>
        <Typography>{label}</Typography>
      </ListItemText>
      {sortingOption.map(({ sort, text }) => {
        return (
          <ListItemText
            key={text}
            onClick={() => {
              handleSorting(sort);
            }}
            sx={{ padding: '0.5rem', cursor: 'pointer' }}
          >
            <Typography color={colorPalette.primary.main} variant="subtitle2">
              {text}
            </Typography>
          </ListItemText>
        );
      })}
      <Divider component="li" variant="fullWidth" />
      <ListItemText sx={{ padding: '0.5rem', cursor: 'pointer' }}>
        <Typography
          color={colorPalette.primary.main}
          onClick={clear}
          variant="button"
        >
          {t('components.table.clearBtn')}
        </Typography>
      </ListItemText>
    </List>
  );
}
