import { Box, Typography, useTheme } from '@mui/material';

type Reputation = 'High' | 'Medium' | 'Low' | 'Unknown';

type Props = {
  reputation: Reputation;
};

type ReputationAttributes = {
  title: string;
  colors: { title: string; border: string };
};

export const ReputationScore = ({ reputation }: Props) => {
  const theme = useTheme();

  const reputationAttributes: Record<Reputation, ReputationAttributes> = {
    High: {
      title: 'High',
      colors: {
        title: theme.palette.success.main,
        border: theme.palette.success.light,
      },
    },
    Medium: {
      title: 'Medium',
      colors: {
        title: theme.palette.warning.main,
        border: theme.palette.warning.light,
      },
    },
    Low: {
      title: 'Low',
      colors: {
        title: theme.palette.error.main,
        border: theme.palette.error.light,
      },
    },
    Unknown: {
      title: 'Coming soon',
      colors: {
        title: theme.palette.ocean.main,
        border: theme.palette.ocean.light,
      },
    },
  };

  const colors = reputationAttributes[reputation].colors;

  return (
    <Box px={2} py={1} borderRadius={4} border={`1px solid ${colors.border}`}>
      <Typography color={colors.title}>
        {reputationAttributes[reputation].title}
      </Typography>
    </Box>
  );
};

export default ReputationScore;
