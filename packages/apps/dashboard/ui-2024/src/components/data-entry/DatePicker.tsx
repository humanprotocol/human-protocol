import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker as DatePickerMui } from '@mui/x-date-pickers/DatePicker';
import { useState } from 'react';

const DatePicker = () => {
	const [isOpened, setIsOpened] = useState(false);
	return (
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<DatePickerMui
				open={isOpened}
				onOpen={() => setIsOpened(true)}
				onClose={() => setIsOpened(false)}
			/>
		</LocalizationProvider>
	);
};

export default DatePicker;
