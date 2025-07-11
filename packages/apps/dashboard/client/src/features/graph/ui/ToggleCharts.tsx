import type { FC } from 'react';

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import FormattedNumber from '@/shared/ui/FormattedNumber';

interface ToggleChartsProps {
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onMouseEnter?: (name: string) => void;
  onMouseLeave?: () => void;
  chartOptions: {
    title: string;
    isAreaChart?: boolean;
    name: string;
    color: string;
    amount?: number | string;
  }[];
}

const ToggleCharts: FC<ToggleChartsProps> = ({
  handleChange,
  chartOptions,
  onMouseLeave,
  onMouseEnter,
}) => {
  return (
    <FormGroup
      sx={{
        marginX: { sx: 4, md: 0 },
      }}
    >
      <Stack
        gap={{ xs: 2, md: 6 }}
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="center"
      >
        {chartOptions.map((elem) => (
          <FormControlLabel
            onMouseEnter={() =>
              onMouseEnter ? onMouseEnter(elem.name) : undefined
            }
            onMouseLeave={() => (onMouseLeave ? onMouseLeave() : undefined)}
            id={elem.name}
            key={elem.name}
            sx={{
              m: 0,
              gap: 1,
            }}
            control={
              <Checkbox
                name={elem.name}
                onChange={handleChange}
                defaultChecked
                sx={{
                  '&.Mui-checked': {
                    color: elem.color,
                  },
                }}
              />
            }
            label={
              <>
                <Typography variant="subtitle2">{elem.title}</Typography>
                <Typography variant="h4" component="p">
                  {elem.amount ? <FormattedNumber value={elem.amount} /> : 0}
                  {elem.name === 'totalTransactionAmount' &&
                    elem.isAreaChart && (
                      <Typography
                        variant="h4"
                        component="span"
                        ml={1}
                        color="text.secondary"
                      >
                        HMT
                      </Typography>
                    )}
                </Typography>
              </>
            }
          />
        ))}
      </Stack>
    </FormGroup>
  );
};

export default ToggleCharts;
