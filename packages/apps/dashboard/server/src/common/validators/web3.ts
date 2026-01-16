import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsIn } from 'class-validator';

import { ChainIds } from '../constants';

export function IsChainId() {
  return applyDecorators(
    IsIn(ChainIds),
    Transform(({ value }) => Number(value)),
  );
}
