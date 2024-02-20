export interface ProposalVoteResult {
    forVotes: string;
    againstVotes: string;
    abstainVotes: string;
}

export interface HubContract {
    methods: {
        proposalVotes(proposalId: string): { call(): Promise<ProposalVoteResult> };
        collectionFinished(proposalId: string): { call(): Promise<boolean> };
        collectionStarted(proposalId: string): { call(): Promise<boolean> };
        spokeContracts(index: number): { call(): Promise<{ contractAddress: string; chainId: string }> };
        spokeVotes(proposalId: string, contractAddress: string, chainIdExtractedNumber: string): { call(): Promise<{ initialized: boolean }> };
    };
}

export interface SpokeContract {
    methods: {
        proposalVotes(proposalId: string): { call(): Promise<ProposalVoteResult> };
    };
}
