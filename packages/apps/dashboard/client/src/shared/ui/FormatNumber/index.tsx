import { NumericFormat } from 'react-number-format';

const FormatNumber = ({
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

export default FormatNumber;
