import { FC } from 'react';

import { Reputation } from '@/services/api/use-leaderboard-details';
import { colorPalette } from '@/assets/styles/color-palette';
import { Box, Typography } from '@mui/material';

type Props = {
  reputation: Reputation;
};

type ReputationAttributes = {
  title: string;
  colors: { title: string; border: string };
};

const reputationAttributes: Record<Reputation, ReputationAttributes> = {
  High: {
    title: 'High',
    colors: {
      title: colorPalette.success.main,
      border: colorPalette.success.light,
    },
  },
  Medium: {
    title: 'Medium',
    colors: {
      title: colorPalette.warning.main,
      border: colorPalette.warning.light,
    },
  },
  Low: {
    title: 'Low',
    colors: {
      title: colorPalette.orange.main,
      border: colorPalette.orange.light,
    },
  },
  Unknown: {
    title: 'Coming soon',
    colors: {
      title: colorPalette.ocean.main,
      border: colorPalette.ocean.light,
    },
  },
};

const ReputationScore: FC<Props> = ({ reputation }) => {
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
