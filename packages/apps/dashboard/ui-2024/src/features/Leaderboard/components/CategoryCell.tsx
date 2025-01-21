import { Chip } from '@mui/material';

interface CategoryCellProps {
  value: string;
}

export const CategoryCell = ({ value }: CategoryCellProps) => (
  <Chip label={value} variant="outlined" color="primary" />
);
