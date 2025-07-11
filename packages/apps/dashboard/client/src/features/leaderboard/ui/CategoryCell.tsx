import type { FC } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

type CategoryCellProps = {
  value?: string;
};

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

const CategoryCell: FC<CategoryCellProps> = ({ value }) =>
  value?.length ? (
    <Box display="flex" alignItems="center" height="100%">
      <Chip
        label={getCategoryLabel(value)}
        variant="outlined"
        color={getCategoryColor(value)}
      />
    </Box>
  ) : null;

export default CategoryCell;
