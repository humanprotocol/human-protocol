import { Chip, Box } from '@mui/material';

interface CategoryCellProps {
  value?: string;
}

export const CategoryCell = ({ value }: CategoryCellProps) =>
  value?.length ? (
    <Box display="flex" alignItems="center" height="100%">
      <Chip
        label={getCategoryLabel(value)}
        variant="outlined"
        color={getCategoryColor(value)}
      />
    </Box>
  ) : null;

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'machine_learning':
      return 'Machine Learning';
    case 'market_making':
      return 'Market Making';
    default:
      return category;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'machine_learning':
      return 'primary';
    case 'market_making':
      return 'success';
    default:
      return 'default';
  }
};
