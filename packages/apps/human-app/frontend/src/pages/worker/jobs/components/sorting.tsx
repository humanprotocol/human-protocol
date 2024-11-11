import { t } from 'i18next';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ListItemButton from '@mui/material/ListItemButton';
import List from '@mui/material/List';
import { Grid } from '@mui/material';
import { SortArrow } from '@/components/ui/icons';
import { useColorMode } from '@/hooks/use-color-mode';
import { Button } from '@/components/ui/button';

interface SortingProps {
  fromHighestSelected: boolean;
  fromLowestSelected: boolean;
  sortFromHighest: () => void;
  sortFromLowest: () => void;
  clear: () => void;
  label: React.ReactElement;
}

export function Sorting({
  fromHighestSelected,
  fromLowestSelected,
  sortFromHighest,
  sortFromLowest,
  clear,
  label,
}: SortingProps) {
  const { colorPalette } = useColorMode();

  return (
    <>
      {label}
      <List
        sx={{
          margin: 0,
        }}
      >
        <ListItemButton
          selected={fromHighestSelected}
          onClick={sortFromHighest}
          sx={{
            width: '100%',
            paddingLeft: '16px',
          }}
        >
          <SortArrow />
          <Typography
            sx={{
              marginLeft: '10px',
            }}
            variant="subtitle1"
          >
            {t('worker.jobs.sortDirection.fromHighest')}
          </Typography>
        </ListItemButton>
        <ListItemButton
          selected={fromLowestSelected}
          onClick={sortFromLowest}
          sx={{
            paddingLeft: '16px',
            width: '100%',
          }}
        >
          <Box
            sx={{
              transform: 'rotate(180deg)',
            }}
          >
            <SortArrow />
          </Box>
          <Typography
            sx={{
              marginLeft: '10px',
            }}
            variant="subtitle1"
          >
            From lowest
          </Typography>
        </ListItemButton>
        <Grid
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button>
            <Typography
              color={colorPalette.primary.main}
              onClick={clear}
              sx={{
                cursor: 'pointer',
              }}
              variant="buttonMedium"
            >
              {t('components.table.clearBtn')}
            </Typography>
          </Button>
        </Grid>
      </List>
    </>
  );
}
