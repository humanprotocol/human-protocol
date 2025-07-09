import { Dispatch, SetStateAction, useState } from 'react';

import Typography from '@mui/material/Typography';
import type { DatePickerProps } from '@mui/x-date-pickers';
import {
  DatePicker as DatePickerMui,
  type DatePickerFieldProps,
} from '@mui/x-date-pickers/DatePicker';
import type { Dayjs } from 'dayjs';

interface CustomDateFieldProps extends DatePickerFieldProps {
  setOpen: Dispatch<SetStateAction<boolean>>;
  label: string;
  id: string;
  InputProps: { ref?: React.Ref<HTMLElement> };
  inputProps: { 'aria-label'?: string };
}

const CustomDateField = ({
  setOpen,
  label,
  id,
  InputProps: { ref } = {},
  inputProps: { 'aria-label': ariaLabel } = {},
}: CustomDateFieldProps) => {
  return (
    <Typography
      id={id}
      ref={ref}
      aria-label={ariaLabel}
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

interface CustomDatePickerProps {
  props: Omit<DatePickerProps<false>, 'open' | 'onOpen' | 'onClose'>;
}

const CustomDatePicker = ({ props }: CustomDatePickerProps) => {
  const [open, setOpen] = useState(false);

  return (
    <DatePickerMui
      {...props}
      slots={{ ...props.slots, field: CustomDateField }}
      slotProps={{ ...props.slotProps, field: { setOpen } as never }}
      open={open}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      sx={{
        '& .StaticDatePicker-calendarContainer .DayPicker-Day': {
          fontSize: 14,
        },
      }}
    />
  );
};

interface DatePickerPropsMui {
  value: Dayjs;
  onChange: (value: Dayjs | null) => void;
  customProps?: Omit<CustomDatePickerProps, 'value' | 'onChange'>['props'];
}

const DatePicker = ({ value, onChange, customProps }: DatePickerPropsMui) => {
  return (
    <CustomDatePicker
      props={{
        label: value.format('DD MMM, YYYY'),
        value: value,
        onChange: onChange,
        ...customProps,
      }}
    />
  );
};

export default DatePicker;
