import { t } from 'i18next';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { forwardRef } from 'react';
import type { NumericFormatProps } from 'react-number-format';
import { NumericFormat } from 'react-number-format';

interface CustomProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

export type InputMaskComponent = ForwardRefExoticComponent<
  CustomProps & RefAttributes<NumericFormatProps>
>;

export const PercentsInputMask = forwardRef<NumericFormatProps, CustomProps>(
  function NumericFormatCustom(props, ref) {
    const { onChange, ...other } = props;

    return (
      <NumericFormat
        {...other}
        getInputRef={ref}
        onValueChange={(values) => {
          onChange({
            target: {
              name: props.name,
              value: values.value,
            },
          });
        }}
        suffix={t('inputMasks.percentSuffix')}
        valueIsNumericString
      />
    );
  }
);
