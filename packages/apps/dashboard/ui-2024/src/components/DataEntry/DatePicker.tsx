import {
	DatePickerProps,
	LocalizationProvider,
	UseDateFieldProps,
} from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker as DatePickerMui } from '@mui/x-date-pickers/DatePicker';
import type { Dayjs } from 'dayjs';
import { Dispatch, SetStateAction, useState } from 'react';
import Typography from '@mui/material/Typography';
import {
	BaseSingleInputFieldProps,
	DateValidationError,
	FieldSection,
} from '@mui/x-date-pickers/models';
import { colorPalette } from '@assets/styles/color-palette';

interface CustomDateFieldProps
	extends UseDateFieldProps<Dayjs, false>,
		BaseSingleInputFieldProps<
			Dayjs | null,
			Dayjs,
			FieldSection,
			false,
			DateValidationError
		> {
	setOpen: Dispatch<SetStateAction<boolean>>;
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
				borderBottom: `1px solid ${colorPalette.primary.main}`,
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
	props: Omit<DatePickerProps<Dayjs>, 'open' | 'onOpen' | 'onClose'>;
}

const CustomDaterPicker = ({ props }: CustomDatePickerProps) => {
	const [open, setOpen] = useState<boolean>(false);

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
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<CustomDaterPicker
				props={{
					label: value.format('DD MMM, YYYY'),
					value: value,
					onChange: onChange,
					...customProps,
				}}
			/>
		</LocalizationProvider>
	);
};

export default DatePicker;
