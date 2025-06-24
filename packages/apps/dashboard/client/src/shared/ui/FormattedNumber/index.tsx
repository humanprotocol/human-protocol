import { FC } from 'react';

import { NumericFormat } from 'react-number-format';

type Props = {
  value: number | string | undefined | null;
  decimalScale?: number;
};

const FormattedNumber: FC<Props> = ({ value, decimalScale = 9 }) => {
  return (
    <NumericFormat
      displayType="text"
      value={value}
      thousandsGroupStyle="thousand"
      thousandSeparator=","
      decimalScale={decimalScale}
    />
  );
};

export default FormattedNumber;
