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
export class IsValidTokenConstraint implements ValidatorConstraintInterface {
  validate(token: string, args: ValidationArguments) {
    const chainId = (args.object as JobDto).chainId as ChainId;
    const validTokens = [
      EscrowFundToken.HMT,
      ...Object.keys(TOKEN_ADDRESSES[chainId] || {}),
    ];
    return validTokens.includes(token);
  }

  defaultMessage(args: ValidationArguments) {
    const chainId = (args.object as JobDto).chainId as ChainId;
    const validTokens = [
      EscrowFundToken.HMT,
      ...Object.keys(TOKEN_ADDRESSES[chainId] || {}),
    ];
    return `Invalid token. Token must be one of the available tokens for the specified chainId: ${validTokens.join(', ')}.`;
  }
}

export function IsValidToken(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidTokenConstraint,
    });
  };
}
