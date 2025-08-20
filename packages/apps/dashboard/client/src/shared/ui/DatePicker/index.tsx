import Typography from '@mui/material/Typography';
import { type DatePickerProps, usePickerContext } from '@mui/x-date-pickers';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import type { Dayjs } from 'dayjs';

const CustomDateField = () => {
  const { triggerRef, setOpen, label } = usePickerContext();

  return (
    <Typography
      ref={triggerRef}
      aria-label="Select date"
      onClick={() => setOpen((prevState) => !prevState)}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'primary.main',
        lineHeight: 2.5,
        '&:hover': {
          cursor: 'pointer',
        },
      }}
    >
      {label}
    </Typography>
  );
};

type MuiDatePickerProps = {
  value: Dayjs;
  onChange: (value: Dayjs | null) => void;
  customProps?: DatePickerProps;
};

const DatePicker = ({ value, onChange, customProps }: MuiDatePickerProps) => {
  return (
    <MuiDatePicker
      label={value.format('DD MMM, YYYY')}
      value={value}
      onChange={onChange}
      slots={{ field: CustomDateField }}
      sx={{
        '& .StaticDatePicker-calendarContainer .DayPicker-Day': {
          fontSize: 14,
        },
      }}
      {...customProps}
    />
  );
};

export default DatePicker;
