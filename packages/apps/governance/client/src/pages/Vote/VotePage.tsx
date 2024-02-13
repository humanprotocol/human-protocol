/* eslint-disable prettier/prettier */

import { Trans } from "@lingui/macro";
import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { useWeb3React } from "@web3-react/core";
import ExecuteModal from "components/vote/ExecuteModal";
import QueueModal from "components/vote/QueueModal";
import RequestCollectionsModal from "components/vote/RequestCollectionsModal";
import { useActiveLocale } from "hooks/useActiveLocale";
import useCurrentBlockTimestamp from "hooks/useCurrentBlockTimestamp";
import JSBI from "jsbi";
import useBlockNumber, { useHubBlockNumber } from "lib/hooks/useBlockNumber";
import { useTokenBalance } from "lib/hooks/useCurrencyBalance";
import { Box } from "nft/components/Box";
import { WarningCircleIcon } from "nft/components/icons";
import VotingButtons from "pages/Vote/VotingButtons";
import { useState } from "react";
import { ArrowLeft } from "react-feather";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router-dom";
import { useAppSelector } from "state/hooks";
import styled from "styled-components/macro";
import { checkProposalState } from "utils/checkProposalPendingState";
import { getDateFromBlock } from "utils/getDateFromBlock";

import { ButtonPrimary } from "../../components/Button";
import { GrayCard } from "../../components/Card";
import { AutoColumn } from "../../components/Column";
import { CardSection, DataCard } from "../../components/earn/styled";
import { RowBetween, RowFixed } from "../../components/Row";
import DelegateModal from "../../components/vote/DelegateModal";
import VoteModal from "../../components/vote/VoteModal";
import {
  AVERAGE_BLOCK_TIME_IN_SECS,
  DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS,
} from "../../constants/governance";
import { ZERO_ADDRESS } from "../../constants/misc";
import { UNI } from "../../constants/tokens";
import {
  useModalIsOpen,
  useToggleDelegateModal,
  useToggleExecuteModal,
  useToggleQueueModal,
  useToggleRequestCollectionsModal,
  useToggleVoteModal,
} from "../../state/application/hooks";
import { ApplicationModal } from "../../state/application/reducer";
import {
  ProposalData,
  ProposalState,
  useAllVotes,
  useCollectionStatus,
  useHasVoted,
  useProposalData,
  useQuorum,
  useUserDelegatee,
  useUserVotesAsOfBlock,
} from "../../state/governance/hooks";
import { VoteOption } from "../../state/governance/types";
import { ExternalLink, StyledInternalLink, ThemedText } from "../../theme";
import { isAddress } from "../../utils";
import { ExplorerDataType, getExplorerLink } from "../../utils/getExplorerLink";
import { ProposalStatus } from "./styled";

const PageWrapper = styled(AutoColumn)`
  display: flex;
  padding-top: 68px;
  width: 820px;

  @media only screen and (max-width: ${({ theme }) =>
      `${theme.breakpoint.lg}px`}) {
    width: unset;
  }

  @media only screen and (max-width: ${({ theme }) =>
      `${theme.breakpoint.md}px`}) {
    padding: 48px 8px 0px;
  }

  @media only screen and (max-width: ${({ theme }) =>
      `${theme.breakpoint.sm}px`}) {
    padding: 20px 0 0;
  }
`;

const ProposalInfo = styled(AutoColumn)`
  position: relative;
  justify-content: center;
  max-width: 820px;
  width: 100%;
  padding: 1.5rem;
  border-radius: 12px;
  background: ${({ theme }) => theme.backgroundSurface};

  @media only screen and (max-width: ${({ theme }) =>
      `${theme.breakpoint.md}px`}) {
    padding: 16px;
  }

  @media only screen and (max-width: ${({ theme }) =>
      `${theme.breakpoint.sm}px`}) {
    padding: 12px;
  }

  @media only screen and (max-width: ${({ theme }) =>
      `${theme.breakpoint.xs}px`}) {
    padding: 12px;
  }
`;

const ArrowWrapper = styled(StyledInternalLink)`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 24px;
  color: ${({ theme }) => theme.textPrimary};
  font-size: 15px;
  font-weight: 600;

  a {
    color: ${({ theme }) => theme.textPrimary};
    text-decoration: none;
  }
  :hover {
    text-decoration: none;
  }
`;

const StyledTitleAutoColumn = styled(AutoColumn)`
  width: 100%;
  margin-top: 24px;

  @media only screen and (max-width: ${({ theme }) =>
      `${theme.breakpoint.sm}px`}) {
    margin-top: 24px;
  }
`;

const CardWrapper = styled.div`
  gap: 12px;
  width: 100%;
`;

const StyledDataCard = styled(DataCard)`
  width: 100%;
  background: none;
  background-color: ${({ theme }) => theme.deprecated_bg1};
  height: fit-content;
  z-index: 2;
  border-radius: 7px;
`;

const ProgressWrapper = styled.div`
  width: 100%;
  margin-top: 1rem;
  height: 4px;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.deprecated_bg3};
  position: relative;
`;

export const Progress = styled.div<{ percentageString?: string }>`
  height: 100%;
  width: ${({ percentageString }) => percentageString ?? "0%"};
  max-width: 100%;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.textPrimary};
`;

const MarkDownWrapper = styled.div`
  max-width: 640px;
  overflow: hidden;
`;

const WrapSmall = styled(RowBetween)`
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    align-items: flex-start;
  `};
`;

const DetailText = styled.div`
  color: ${({ theme }) => theme.textPrimary};
  word-break: break-all;

  span:nth-child(0),
  a {
    color: ${({ theme }) => theme.textVioletSecondary};
  }
`;

const ProposerAddressLink = styled(ExternalLink)`
  word-break: break-all;
  color: ${({ theme }) => theme.textVioletSecondary};
`;

export default function VotePage() {
  const { governorIndex, id } = useParams() as {
    governorIndex: string;
    id: string;
  };

  const { votes, loading } = useAllVotes(id);

  const forVotes = votes["for"];
  const againstVotes = votes["against"];
  const abstainVotes = votes["abstain"];

  const parsedGovernorIndex = Number.parseInt(governorIndex);
  const { chainId, account } = useWeb3React();

  const isHubChainActive = useAppSelector(
    (state) => state.application.isHubChainActive
  );
  const hubBlock = useHubBlockNumber();

  const quorumAmount = useQuorum();
  // const quorumNumber = Number(quorumAmount?.toExact())
  const quorumNumber = Number(
    quorumAmount?.toExact({
      groupSeparator: ",",
    })
  );

  const hasVoted = useHasVoted(id);

  // get data for this specific proposal
  const proposalData: ProposalData | undefined = useProposalData(
    parsedGovernorIndex,
    id
  );
  const { proposalExecutionData, status, endBlock } = proposalData || {};

  // update vote option based on button interactions
  const [voteOption, setVoteOption] = useState<VoteOption | undefined>(
    undefined
  );

  // modal for casting votes
  const showVoteModal = useModalIsOpen(ApplicationModal.VOTE);
  const toggleVoteModal = useToggleVoteModal();

  // toggle for showing delegation modal
  const showDelegateModal = useModalIsOpen(ApplicationModal.DELEGATE);
  const toggleDelegateModal = useToggleDelegateModal();

  // Request collections modal
  const showRequestCollectionsModal = useModalIsOpen(
    ApplicationModal.REQUEST_COLLECTIONS
  );
  const toggleRequestCollectionsModal = useToggleRequestCollectionsModal();

  // toggle for showing queue modal
  const showQueueModal = useModalIsOpen(ApplicationModal.QUEUE);
  const toggleQueueModal = useToggleQueueModal();

  // toggle for showing execute modal
  const showExecuteModal = useModalIsOpen(ApplicationModal.EXECUTE);
  const toggleExecuteModal = useToggleExecuteModal();

  // get and format date from data
  const currentTimestamp = useCurrentBlockTimestamp();
  const currentBlock = useBlockNumber();

  const startDate = getDateFromBlock(
    proposalData?.startBlock,
    currentBlock,
    (chainId && AVERAGE_BLOCK_TIME_IN_SECS[chainId]) ??
      DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS,
    currentTimestamp
  );
  const endDate = getDateFromBlock(
    proposalData?.endBlock,
    currentBlock,
    (chainId && AVERAGE_BLOCK_TIME_IN_SECS[chainId]) ??
      DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS,
    currentTimestamp
  );
  const now = new Date();
  const locale = useActiveLocale();
  const dateFormat: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZoneName: "short",
  };

  const totalVotes = forVotes + abstainVotes;

  const quorumPercentage =
    totalVotes > 0 && quorumNumber > 0
      ? (
          ((forVotes + againstVotes + abstainVotes) / quorumNumber) *
          100
        ).toFixed()
      : 0;

  // only count available votes as of the proposal start block
  const availableVotes: CurrencyAmount<Token> | undefined =
    useUserVotesAsOfBlock(proposalData?.startBlock ?? undefined, id);

  // only show voting if user has > 0 votes at proposal start block and proposal is active,
  const showVotingButtons =
    availableVotes &&
    JSBI.greaterThan(availableVotes.quotient, JSBI.BigInt(0)) &&
    proposalData &&
    proposalData.status === ProposalState.ACTIVE &&
    !!account &&
    !hasVoted;

  const {
    collectionStartedResponse,
    collectionFinishedResponse,
    loading: collectionStatusLoading,
  } = useCollectionStatus(id);

  const showRequestCollectionsButton = Boolean(
    isHubChainActive &&
      account &&
      checkProposalState(status, hubBlock, endBlock) ===
        ProposalState.COLLECTION_PHASE &&
      !collectionFinishedResponse
  );

  const collectionPhaseInProgress = Boolean(
    account &&
      checkProposalState(status, hubBlock, endBlock) ===
        ProposalState.COLLECTION_PHASE &&
      collectionStartedResponse &&
      !collectionFinishedResponse
  );

  const showQueueButton =
    Boolean(
      isHubChainActive &&
        account &&
        proposalData?.status === ProposalState.SUCCEEDED
    ) &&
    !!collectionStartedResponse &&
    !!collectionFinishedResponse;

  const showExecuteButton =
    Boolean(
      isHubChainActive &&
        account &&
        proposalData?.status === ProposalState.QUEUED
    ) && !!collectionFinishedResponse;

  const uniBalance: CurrencyAmount<Token> | undefined = useTokenBalance(
    account ?? undefined,
    chainId ? UNI[chainId] : undefined
  );
  const { userDelegatee }: { userDelegatee: string; isLoading: boolean } =
    useUserDelegatee();

  // in blurb link to home page if they are able to unlock
  const showLinkForUnlock = Boolean(
    uniBalance &&
      JSBI.notEqual(uniBalance.quotient, JSBI.BigInt(0)) &&
      userDelegatee === ZERO_ADDRESS
  );

  // show links in propsoal details if content is an address
  // if content is contract with common name, replace address with common name
  const linkIfAddress = (content: string) => {
    if (isAddress(content) && chainId) {
      return (
        <ExternalLink
          href={getExplorerLink(chainId, content, ExplorerDataType.ADDRESS)}
        >
          {content}
        </ExternalLink>
      );
    }
    return <span>{content}</span>;
  };

  function MarkdownImage({ ...rest }) {
    return (
      <img
        {...rest}
        style={{ width: "100%", height: "100$", objectFit: "cover" }}
        alt=""
      />
    );
  }

  if (!proposalData) return null;
  return (
    <>
      <PageWrapper gap="lg" justify="center">
        <VoteModal
          isOpen={showVoteModal}
          onDismiss={toggleVoteModal}
          proposalId={proposalData?.id}
          voteOption={voteOption}
          availableVotes={availableVotes}
          id={id}
        />
        <DelegateModal
          accountAddress=""
          isOpen={showDelegateModal}
          onDismiss={toggleDelegateModal}
          title={<Trans>Unlock Votes</Trans>}
        />
        <RequestCollectionsModal
          isOpen={showRequestCollectionsModal}
          onDismiss={toggleRequestCollectionsModal}
          proposalId={id}
        />
        <QueueModal
          isOpen={showQueueModal}
          onDismiss={toggleQueueModal}
          proposalId={proposalData?.id}
          proposalExecutionData={proposalExecutionData}
        />
        <ExecuteModal
          isOpen={showExecuteModal}
          onDismiss={toggleExecuteModal}
          proposalId={proposalData?.id}
          proposalExecutionData={proposalExecutionData}
        />
        <ProposalInfo gap="lg" justify="start">
          <RowBetween style={{ width: "100%" }}>
            <ArrowWrapper to="/">
              <Trans>
                <ArrowLeft size={20} /> Proposals
              </Trans>
            </ArrowWrapper>
            {proposalData && (
              <ProposalStatus
                status={checkProposalState(status, hubBlock, endBlock)}
              />
            )}
          </RowBetween>
          <StyledTitleAutoColumn gap="10px">
            <ThemedText.SubHeaderLarge style={{ marginBottom: ".5rem" }}>
              {proposalData?.title}
            </ThemedText.SubHeaderLarge>
            <RowBetween>
              <ThemedText.DeprecatedMain>
                {startDate && startDate > now ? (
                  <Trans>
                    Voting starts approximately{" "}
                    {startDate.toLocaleString(locale, dateFormat)}
                  </Trans>
                ) : null}
              </ThemedText.DeprecatedMain>
            </RowBetween>
            <RowBetween>
              <ThemedText.DeprecatedMain>
                {endDate &&
                  (endDate < now ? (
                    <Trans>
                      Voting ended {endDate.toLocaleString(locale, dateFormat)}
                    </Trans>
                  ) : (
                    <Trans>
                      Voting ends approximately{" "}
                      {endDate.toLocaleString(locale, dateFormat)}
                    </Trans>
                  ))}
              </ThemedText.DeprecatedMain>
            </RowBetween>
            {proposalData &&
              proposalData.status === ProposalState.ACTIVE &&
              showVotingButtons === false &&
              !hasVoted &&
              account && (
                <GrayCard>
                  <Box>
                    <WarningCircleIcon />
                  </Box>
                  Only vHMT votes that were self delegated before block{" "}
                  {proposalData.startBlock} are eligible for voting.
                  {showLinkForUnlock && (
                    <span>
                      <Trans>
                        <StyledInternalLink to="/vote">
                          Unlock voting
                        </StyledInternalLink>{" "}
                        to prepare for the next proposal.
                      </Trans>
                    </span>
                  )}
                </GrayCard>
              )}
            {proposalData && hasVoted && account && (
              <GrayCard>
                <Box>
                  <WarningCircleIcon />
                </Box>
                <Trans>You have already voted for this proposal.</Trans>
              </GrayCard>
            )}
            {proposalData && !account && (
              <GrayCard>
                <Box>
                  <WarningCircleIcon />
                </Box>
                <Trans>
                  Please connect a wallet with delegated voting power.
                </Trans>
              </GrayCard>
            )}
          </StyledTitleAutoColumn>

          <VotingButtons
            forVotes={forVotes}
            againstVotes={againstVotes}
            abstainVotes={abstainVotes}
            setVoteOption={setVoteOption}
            showVotingButtons={showVotingButtons}
            proposalStatus={proposalData?.status}
            loading={loading}
          />

          {showRequestCollectionsButton && !collectionStatusLoading && (
            <ButtonPrimary
              onClick={() => toggleRequestCollectionsModal()}
              disabled={collectionPhaseInProgress || collectionStatusLoading}
            >
              {collectionPhaseInProgress ? (
                <Trans>Collection phase in progress</Trans>
              ) : (
                <Trans>Request Collection</Trans>
              )}
            </ButtonPrimary>
          )}

          {showQueueButton && (
            <RowFixed style={{ width: "100%", gap: "12px" }}>
              <ButtonPrimary
                padding="8px"
                onClick={() => {
                  toggleQueueModal();
                }}
              >
                <Trans>Queue</Trans>
              </ButtonPrimary>
            </RowFixed>
          )}
          {showExecuteButton && (
            <>
              <RowFixed style={{ width: "100%", gap: "12px" }}>
                <ButtonPrimary
                  padding="8px"
                  onClick={() => {
                    toggleExecuteModal();
                  }}
                >
                  <Trans>Execute</Trans>
                </ButtonPrimary>
              </RowFixed>
            </>
          )}
          <CardWrapper>
            <StyledDataCard>
              <CardSection>
                <AutoColumn gap="md">
                  <WrapSmall>
                    <ThemedText.BodyPrimary fontSize={14}>
                      <Trans>Quorum</Trans>
                    </ThemedText.BodyPrimary>
                    {proposalData ? (
                      <ThemedText.BodyPrimary fontSize={14}>
                        {totalVotes}
                        <span>{` / ${quorumNumber ? quorumNumber : "-"}`}</span>
                      </ThemedText.BodyPrimary>
                    ) : (
                      "-"
                    )}
                  </WrapSmall>
                </AutoColumn>
                <ProgressWrapper>
                  <Progress percentageString={`${quorumPercentage ?? 0}%`} />
                </ProgressWrapper>
              </CardSection>
            </StyledDataCard>
          </CardWrapper>
          <AutoColumn gap="16px">
            <ThemedText.SubHeaderLarge>
              <Trans>Details</Trans>
            </ThemedText.SubHeaderLarge>
            {proposalData?.details?.map((d, i) => {
              return (
                <DetailText key={i}>
                  {i + 1}: {linkIfAddress(d.target)}.{d.functionSig}(
                  {d.callData.split(",").map((content, i) => {
                    return (
                      <span key={i}>
                        {linkIfAddress(content)}
                        {d.callData.split(",").length - 1 === i ? "" : ","}
                      </span>
                    );
                  })}
                  )
                </DetailText>
              );
            })}
          </AutoColumn>
          <AutoColumn gap="md">
            <ThemedText.SubHeaderLarge>
              <Trans>Description</Trans>
            </ThemedText.SubHeaderLarge>
            <MarkDownWrapper>
              <ReactMarkdown
                source={proposalData?.description}
                renderers={{
                  image: MarkdownImage,
                }}
              />
            </MarkDownWrapper>
          </AutoColumn>
          <AutoColumn gap="md">
            <ThemedText.SubHeaderLarge>
              <Trans>Proposer</Trans>
            </ThemedText.SubHeaderLarge>
            <ProposerAddressLink
              href={
                proposalData?.proposer && chainId
                  ? getExplorerLink(
                      chainId,
                      proposalData?.proposer,
                      ExplorerDataType.ADDRESS
                    )
                  : ""
              }
            >
              <ReactMarkdown source={proposalData?.proposer} />
            </ProposerAddressLink>
          </AutoColumn>
        </ProposalInfo>
      </PageWrapper>
    </>
  );
}
