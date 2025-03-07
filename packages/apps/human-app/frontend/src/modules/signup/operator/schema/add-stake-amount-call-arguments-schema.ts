import { z } from 'zod';
import { t } from 'i18next';

type AmountValidation = z.ZodEffects<
  z.ZodEffects<z.ZodString, string, string>,
  string,
  string
>;

type AmountField = z.infer<AmountValidation>;

export const addStakeAmountCallArgumentsSchema = (
  decimals: number
): AmountValidation =>
  z
    .string()
    .refine((amount) => !amount.startsWith('-'))
    .refine(
      (amount) => {
        const decimalPart = amount.toString().split('.')[1];
        if (!decimalPart) return true;
        return decimalPart.length <= decimals;
      },
      {
        message: t('operator.stakeForm.invalidDecimals', {
          decimals,
        }),
      }
    );

export interface AddStakeCallArguments {
  amount: AmountField;
}
