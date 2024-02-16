const API_URL = process.env.REACT_APP_VOTE_AGGREGATOR_ADDRESS as string

export interface ChainVoteData {
  chain_name: string
  for: string | number
  against: string | number
  abstain: string | number
}

export async function fetchVotes(proposalId: string): Promise<ChainVoteData[]> {
  const response = await fetch(API_URL + proposalId)

  if (!response.ok) {
    throw new Error(`Failed to fetch votes for proposal: ${proposalId}`)
  }

  const data = await response.json()
  return data
}
