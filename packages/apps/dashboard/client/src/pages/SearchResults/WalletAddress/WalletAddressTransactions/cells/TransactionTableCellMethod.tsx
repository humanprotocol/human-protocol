import { colorPalette } from '@assets/styles/color-palette';
import Box from '@mui/material/Box/Box';
import Typography from '@mui/material/Typography';
import { capitalize } from '@mui/material';

export const TransactionTableCellMethod = ({ method }: { method: string }) => {
  const methodAttributes: Record<
    string,
    { color: { text: string; border: string } }
  > = {
    withdraw: {
      color: {
        text: colorPalette.error.main,
        border: colorPalette.error.light,
      },
    },
    cancel: {
      color: {
        text: colorPalette.error.main,
        border: colorPalette.error.light,
      },
    },
    stake: {
      color: {
        text: colorPalette.success.main,
        border: colorPalette.success.light,
      },
    },
    unstake: {
      color: {
        text: colorPalette.error.main,
        border: colorPalette.error.light,
      },
    },
    slash: {
      color: {
        text: colorPalette.error.main,
        border: colorPalette.error.light,
      },
    },
    stakeWithdrawn: {
      color: {
        text: colorPalette.error.main,
        border: colorPalette.error.light,
      },
    },
    withdrawFees: {
      color: {
        text: colorPalette.error.main,
        border: colorPalette.error.light,
      },
    },
    approve: {
      color: {
        text: colorPalette.warning.main,
        border: colorPalette.warning.light,
      },
    },
    complete: {
      color: {
        text: colorPalette.success.main,
        border: colorPalette.success.light,
      },
    },
  };

  const currentStatusColors = methodAttributes[method]?.color || {
    text: colorPalette.primary.main,
    border: colorPalette.primary.light,
  };

  return (
    <Box
      sx={{
        display: 'inline-flex',
        paddingX: 2,
        paddingY: 1,
        borderRadius: 6,
        border: `1px solid ${currentStatusColors.border}`,
      }}
    >
      <Typography
        sx={{
          color: `${currentStatusColors.text}`,
        }}
      >
        {capitalize(method)}
      </Typography>
    </Box>
  );
};
