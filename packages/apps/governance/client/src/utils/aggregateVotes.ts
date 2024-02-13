import { BigNumber } from '@ethersproject/bignumber'
import { ChainVoteData } from 'api/votes'

const toBigNumber = (value: number | string): BigNumber => {
  return BigNumber.from(value.toString())
}

const truncateLargeNumber = (value: BigNumber): number => {
  const divisor = BigNumber.from('1000000000000000000')
  const quotient = value.div(divisor)
  const remainder = value.mod(divisor)
  const decimalPart = remainder.mul(BigNumber.from('1000')).div(divisor).toNumber() / 1000
  const rounded = Math.round((quotient.toNumber() + decimalPart) * 100) / 100

  return rounded
}

export const aggregateVotes = (data: ChainVoteData[]) => {
  const aggregatedBigNumbers = data.reduce(
    (acc, chainData) => ({
      for: acc.for.add(toBigNumber(chainData.for)),
      against: acc.against.add(toBigNumber(chainData.against)),
      abstain: acc.abstain.add(toBigNumber(chainData.abstain)),
    }),
    {
      for: BigNumber.from(0),
      against: BigNumber.from(0),
      abstain: BigNumber.from(0),
    }
  )

  return {
    for: truncateLargeNumber(aggregatedBigNumbers.for),
    against: truncateLargeNumber(aggregatedBigNumbers.against),
    abstain: truncateLargeNumber(aggregatedBigNumbers.abstain),
  }
}
