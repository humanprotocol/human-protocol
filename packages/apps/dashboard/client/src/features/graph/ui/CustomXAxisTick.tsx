import useTheme from '@mui/material/styles/useTheme';
// @ts-expect-error -- import error, but this type work property
import { ContentRenderer } from 'recharts';

import formatDate from '../lib/formatDate';

const CustomXAxisTick = ({ x, y, payload }: ContentRenderer<string>) => {
  const theme = useTheme();

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-30}
        y={0}
        fill={theme.palette.fog.main}
        transform="rotate(-35)"
        fontSize={10}
        fontWeight={500}
      >
        {formatDate(payload.value, 'D MMM')}
      </text>
    </g>
  );
};

export default CustomXAxisTick;
