import { useScreenSize } from 'hooks/useScreenSize'
import { Progress } from 'pages/Vote/VotePage'
import { ProposalState } from 'state/governance/hooks'
import { VoteOption } from 'state/governance/types'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

import { ButtonPrimary } from '../../components/Button'
import { useToggleVoteModal } from '../../state/application/hooks'

const VOTING_BUTTONS = [
  { buttonLabel: 'Vote For', voteOption: VoteOption.For, numberLabel: 'Votes For' },
  { buttonLabel: 'Vote Against', voteOption: VoteOption.Against, numberLabel: 'Votes Against' },
  { buttonLabel: 'Abstain', voteOption: VoteOption.Abstain, numberLabel: 'Abstain' },
]

const MAX_CONTAINER_WIDTH = '320px'

const VotingButtonsContainer = styled('div')`
  width: 100%;
  display: flex;
  flex-direction: row;
  gap: 16px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    flex-direction: column;
  }
`

const InnerButtonTextContainer = styled('div')<{ showVotingButtons?: boolean }>`
  width: 100%;
  max-width: ${MAX_CONTAINER_WIDTH};
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: ${({ showVotingButtons }) => (showVotingButtons ? '24px' : '0')};
  white-space: nowrap;
  margin-bottom: 24px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    margin-bottom: 0;
    flex-direction: row;
  }
`

const ButtonContainer = styled('div')`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 16px 24px;
  background: ${({ theme }) => theme.backgroundGray};
  border-radius: 7px;

  > button {
    max-width: 204px;
    height: 42px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    gap: 36px;
    padding: 24px 24px 24px 32px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    gap: 16px;
  }
`

const VotesNumberContainer = styled('div')``

const ResultsLabelContainer = styled('div')`
  margin-bottom: 0px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding: 8px 0 8px 0;
    margin-bottom: -16px;
  }
`

const ProgressWrapper = styled.div`
  width: 100%;
  height: 7px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.deprecated_bg3};
  position: relative;
  max-width: ${MAX_CONTAINER_WIDTH};
`

const StyledButtonPrimary = styled(ButtonPrimary)`
  && {
    width: 100%;
    max-width: ${MAX_CONTAINER_WIDTH};
  }
`

interface VotingButtonsProps {
  forVotes: number
  againstVotes: number
  abstainVotes: number
  setVoteOption: React.Dispatch<React.SetStateAction<VoteOption | undefined>>
  showVotingButtons: boolean | undefined
  proposalStatus: ProposalState | undefined
  loading: boolean
}

export default function VotingButtons({
  forVotes,
  againstVotes,
  abstainVotes,
  setVoteOption,
  showVotingButtons,
  proposalStatus,
  loading,
}: VotingButtonsProps) {
  const toggleVoteModal = useToggleVoteModal()
  const theme = useTheme()
  const isScreenSize = useScreenSize()

  const allVotesSum = forVotes + againstVotes + abstainVotes

  const chooseValue = (valueType: number) => {
    if (valueType === VoteOption.Against) return againstVotes
    if (valueType === VoteOption.For) return forVotes
    return abstainVotes
  }

  return (
    <>
      {!showVotingButtons && (
        <ResultsLabelContainer>
          <ThemedText.BodyPrimary fontSize={isScreenSize.md ? 20 : 18} fontWeight={500} fontFamily="Inter">
            Live Results
          </ThemedText.BodyPrimary>
        </ResultsLabelContainer>
      )}
      <VotingButtonsContainer>
        {VOTING_BUTTONS.map(({ buttonLabel, voteOption, numberLabel }, index) => (
          <ButtonContainer key={index}>
            <InnerButtonTextContainer>
              <ThemedText.BodyPrimary fontSize={14}>{numberLabel}</ThemedText.BodyPrimary>
              <VotesNumberContainer>
                <ThemedText.BodyPrimary fontSize={isScreenSize.xs ? 20 : 16} fontWeight={500}>
                  {loading ? '-' : chooseValue(voteOption)}
                </ThemedText.BodyPrimary>
              </VotesNumberContainer>
            </InnerButtonTextContainer>
            {showVotingButtons ? (
              <StyledButtonPrimary
                padding="8px"
                onClick={() => {
                  setVoteOption(voteOption)
                  toggleVoteModal()
                }}
              >
                <ThemedText.BodyPrimary
                  fontSize={15}
                  color={
                    proposalStatus === ProposalState.PENDING || !showVotingButtons ? theme.accentGray : theme.white
                  }
                >
                  {buttonLabel}
                </ThemedText.BodyPrimary>
              </StyledButtonPrimary>
            ) : (
              <ProgressWrapper>
                <Progress
                  percentageString={
                    (chooseValue(voteOption) as number) === 0
                      ? '0%'
                      : `${(chooseValue(voteOption) / allVotesSum) * 100}%`
                  }
                />
              </ProgressWrapper>
            )}
          </ButtonContainer>
        ))}
      </VotingButtonsContainer>
    </>
  )
}
