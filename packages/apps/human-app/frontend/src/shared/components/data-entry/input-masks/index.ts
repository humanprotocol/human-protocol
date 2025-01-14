import { HumanCurrencyInputMask } from '@/shared/components/data-entry/input-masks/human-currency';
import { PercentsInputMask } from '@/shared/components/data-entry/input-masks/percents';

export type InputMask =
  | typeof HumanCurrencyInputMask
  | typeof PercentsInputMask;

export { HumanCurrencyInputMask, PercentsInputMask };
