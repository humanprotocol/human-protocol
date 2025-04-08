import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { TOKEN_ADDRESSES } from '../constants/tokens';
import { ChainId } from '@human-protocol/sdk';
import { EscrowFundToken } from '../enums/job';

@ValidatorConstraint({ async: false })
export class IsValidTokenDecimalsConstraint
  implements ValidatorConstraintInterface
{
  validate(value: number, args: ValidationArguments) {
    const [tokenProperty] = args.constraints;
    const dto = args.object as Record<string, any>;
    const chainId = dto.chainId as ChainId;
    const token = dto[tokenProperty] as EscrowFundToken;

    if (!chainId || !token) {
      return false;
    }

    const tokenInfo = TOKEN_ADDRESSES[chainId]?.[token];

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
    const [tokenProperty] = args.constraints;
    const dto = args.object as Record<string, any>;
    const chainId = dto.chainId as ChainId;
    const token = dto[tokenProperty] as EscrowFundToken;
    console.log('token', token);

    const tokenInfo = TOKEN_ADDRESSES[chainId]?.[token];
    const maxDecimals = tokenInfo?.decimals || 'unknown';
    console.log('tokenInfo', tokenInfo);
    console.log('maxDecimals', maxDecimals);
    return `${args.property} must have at most ${maxDecimals} decimal places for the selected token (${token}) on chainId ${chainId}.`;
  }
}

export function IsValidTokenDecimals(
  tokenProperty: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [tokenProperty],
      validator: IsValidTokenDecimalsConstraint,
    });
  };
}
