import { styled } from '@mui/material';
import type { CircularProgressProps } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { colorPalette } from '@/styles/color-palette';

const LoaderStyled = styled(CircularProgress)({
  '.MuiCircularProgress-circle': { color: colorPalette.primary.main },
});

export function Loader({ ...props }: CircularProgressProps) {
  return <LoaderStyled {...props} />;
}
