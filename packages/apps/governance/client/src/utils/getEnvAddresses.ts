import { AddressMap } from 'constants/addresses'

export const getEnvAddresses = (prefix: string): AddressMap => {
  const result: AddressMap = {}
  for (const key in process.env) {
    if (key.startsWith(prefix)) {
      const chainId = parseInt(key.replace(prefix, ''), 10)

      if (isNaN(chainId)) {
        throw new Error(`Invalid chain id in environment variable ${key}`)
      }

      result[chainId] = process.env[key] as string
    }
  }
  return result
}
