import { HumanCurrencyInputMask } from '@/components/data-entry/input-masks/human-currency-input-mask';
import { PercentsInputMask } from '@/components/data-entry/input-masks/percents-input-mask';

export const InputMasks = {
  HumanCurrencyInputMask,
  PercentsInputMask,
};

export type InputMask = keyof typeof InputMasks;
