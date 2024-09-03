import { NumericFormat } from 'react-number-format';

export const FormatNumber = ({ value }: { value: number }) => {
	return (
		<NumericFormat
			displayType="text"
			value={value}
			thousandsGroupStyle="thousand"
			thousandSeparator=","
		/>
	);
};
