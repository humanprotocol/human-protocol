import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { JobDto } from 'src/modules/job/job.dto';
import { TOKEN_ADDRESSES } from '../constants/tokens';
import { ChainId } from '@human-protocol/sdk';
import { EscrowFundToken } from '../enums/job';

@ValidatorConstraint({ async: false })
export class IsValidTokenDecimalsConstraint
  implements ValidatorConstraintInterface
{
  validate(value: number, args: ValidationArguments) {
    const dto = args.object as JobDto;
    const { paymentCurrency, chainId } = dto;

    if (!chainId || !paymentCurrency) {
      return false;
    }

    const tokenInfo =
      TOKEN_ADDRESSES[chainId as ChainId]?.[paymentCurrency as EscrowFundToken];

    if (!tokenInfo) {
      return false;
    }

    const maxDecimals = tokenInfo.decimals;

    if (typeof value !== 'number') {
      return false;
    }

    const [_, decimals] = value.toString().split('.');
    return !decimals || decimals.length <= maxDecimals;
  }

  defaultMessage(args: ValidationArguments) {
    const dto = args.object as JobDto;
    const { paymentCurrency, chainId } = dto;

    const tokenInfo =
      TOKEN_ADDRESSES[chainId as ChainId]?.[paymentCurrency as EscrowFundToken];

    const maxDecimals = tokenInfo?.decimals || 'unknown';
    return `${args.property} must have at most ${maxDecimals} decimal places for the selected paymentCurrency (${paymentCurrency}) on chainId ${chainId}.`;
  }
}

export function IsValidTokenDecimals(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidTokenDecimalsConstraint,
    });
  };
}
