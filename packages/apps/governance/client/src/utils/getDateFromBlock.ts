import { BigNumber } from '@ethersproject/bignumber'
import ms from 'ms.macro'

export function getDateFromBlock(
  targetBlock: number | undefined,
  currentBlock: number | undefined,
  averageBlockTimeInSeconds: number | undefined,
  currentTimestamp: BigNumber | undefined
): Date | undefined {
  if (targetBlock && currentBlock && averageBlockTimeInSeconds && currentTimestamp) {
    const date = new Date()
    date.setTime(
      currentTimestamp
        .add(BigNumber.from(averageBlockTimeInSeconds).mul(BigNumber.from(targetBlock - currentBlock)))
        .toNumber() * ms`1 second`
    )
    return date
  }
  return undefined
}
