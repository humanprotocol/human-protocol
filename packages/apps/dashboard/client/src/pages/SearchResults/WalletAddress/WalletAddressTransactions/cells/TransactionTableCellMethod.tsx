import Box from '@mui/material/Box/Box';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

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
    <Box
      display="inline-flex"
      px={1.5}
      py={1}
      borderRadius={8}
      border={`1px solid ${getColorFromTheme(currentStatusColors.border)}`}
    >
      <Typography
        textTransform="capitalize"
        color={getColorFromTheme(currentStatusColors.text)}
      >
        {method}
      </Typography>
    </Box>
  );
};
