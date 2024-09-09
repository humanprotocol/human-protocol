import { NumericFormat } from 'react-number-format';

export const FormatNumber = ({
	value,
}: {
	value: number | string | undefined | null;
}) => {
	return (
		<NumericFormat
			displayType="text"
			value={value}
			thousandsGroupStyle="thousand"
			thousandSeparator=","
		/>
	);
};
export const FormatNumberWithDecimals = ({
	value,
}: {
	value: number | string | undefined | null;
}) => {
	if (value && Number(value) < 1) {
		return value;
	}
	return (
		<NumericFormat
			displayType="text"
			value={value}
			thousandsGroupStyle="thousand"
			thousandSeparator=","
		/>
	);
};
