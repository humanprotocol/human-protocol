import { styled } from '@mui/material';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';

import {
  TIME_PERIOD_OPTIONS,
  TimePeriod,
  useGraphPageChartParams,
} from '@/utils/hooks/use-graph-page-chart-params';

export const StyledToggleButtonGroup = styled(ToggleButtonGroup)(
  ({ theme }) => ({
    gap: 8,
    '.MuiToggleButtonGroup-grouped': {
      border: 'none',
      borderRadius: 4,
      width: 47,
      height: 30,
      color: theme.palette.primary.main,
    },
  })
);

const ToggleButtons = () => {
  const { setTimePeriod, selectedTimePeriod, dateRangeParams } =
    useGraphPageChartParams();

  const checkIfSelected = (element: TimePeriod) => {
    if (element.name !== 'ALL') {
      return (
        element.value.isSame(dateRangeParams.from) &&
        dateRangeParams.to.isSame(dayjs(), 'day')
      );
    }
  };

  return (
    <StyledToggleButtonGroup
      value={selectedTimePeriod}
      aria-label="text-alignment"
      exclusive
    >
      {TIME_PERIOD_OPTIONS.map((elem) => (
        <ToggleButton
          key={elem.name}
          onClick={() => setTimePeriod(elem)}
          selected={checkIfSelected(elem)}
          value={elem.name}
          sx={{
            '.MuiTypography-root': {
              wordBreak: 'normal',
            },
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'white.main',
            },
            '&.Mui-selected:hover': {
              backgroundColor: 'primary.main',
            },
          }}
        >
          <Typography variant="Button Small">{elem.name}</Typography>
        </ToggleButton>
      ))}
    </StyledToggleButtonGroup>
  );
};

export default ToggleButtons;
