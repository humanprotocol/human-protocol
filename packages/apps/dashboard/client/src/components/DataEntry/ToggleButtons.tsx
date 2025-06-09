import { styled } from '@mui/material';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
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
      minWidth: 'unset',
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
        <Button
          key={elem.name}
          size="small"
          component={ToggleButton}
          onClick={() => setTimePeriod(elem)}
          selected={checkIfSelected(elem)}
          value={elem.name}
          sx={{
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'white.main',
            },
            '&.Mui-selected:hover': {
              backgroundColor: 'primary.main',
            },
          }}
        >
          {elem.name}
        </Button>
      ))}
    </StyledToggleButtonGroup>
  );
};

export default ToggleButtons;
