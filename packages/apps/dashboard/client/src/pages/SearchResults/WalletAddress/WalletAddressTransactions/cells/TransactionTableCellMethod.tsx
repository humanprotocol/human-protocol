import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';

type PaletteColorKey =
  | 'primary'
  | 'secondary'
  | 'error'
  | 'warning'
  | 'info'
  | 'success';
type PaletteShadeKey = 'main' | 'light' | 'dark';

const methodAttributes: Record<
  string,
  { color: { text: string; border: string } }
> = {
  withdraw: {
    color: {
      text: 'error.main',
      border: 'error.light',
    },
  },
  cancel: {
    color: {
      text: 'error.main',
      border: 'error.light',
    },
  },
  stake: {
    color: {
      text: 'success.main',
      border: 'success.light',
    },
  },
  unstake: {
    color: {
      text: 'error.main',
      border: 'error.light',
    },
  },
  slash: {
    color: {
      text: 'error.main',
      border: 'error.light',
    },
  },
  stakeWithdrawn: {
    color: {
      text: 'error.main',
      border: 'error.light',
    },
  },
  withdrawFees: {
    color: {
      text: 'error.main',
      border: 'error.light',
    },
  },
  approve: {
    color: {
      text: 'warning.main',
      border: 'warning.light',
    },
  },
  complete: {
    color: {
      text: 'success.main',
      border: 'success.light',
    },
  },
};

export const TransactionTableCellMethod = ({ method }: { method: string }) => {
  const theme = useTheme();
  const currentStatusColors = methodAttributes[method]?.color || {
    text: 'primary.main',
    border: 'primary.light',
  };

  const getColorFromTheme = (colorString: string) => {
    const [color, shade] = colorString.split('.') as [
      PaletteColorKey,
      PaletteShadeKey,
    ];
    return theme.palette[color][shade];
  };

  return (
    <Chip
      label={method}
      variant="outlined"
      sx={{
        borderColor: getColorFromTheme(currentStatusColors.border),
        color: getColorFromTheme(currentStatusColors.text),
        textTransform: 'capitalize',
      }}
    />
  );
};
