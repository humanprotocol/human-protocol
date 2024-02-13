/* eslint-disable prettier/prettier */
import { Trans } from "@lingui/macro";
import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { useWeb3React } from "@web3-react/core";
import { ButtonPrimary } from "components/Button";
import { AutoColumn } from "components/Column";
import { AutoRow, RowBetween, RowFixed } from "components/Row";
import TransferAddressInput from "components/TransferAddressInput/TransferAddressInput";
import DelegateModal from "components/vote/DelegateModal";
import DepositHMTModal from "components/vote/DepositHMTModal";
import DepositVHMTModal from "components/vote/DepositVHMTModal";
import ProposalEmptyState from "components/vote/ProposalEmptyState";
import JSBI from "jsbi";
import { useHubBlockNumber } from "lib/hooks/useBlockNumber";
import { useHmtContractToken } from "lib/hooks/useCurrencyBalance";
import { useTokenBalance } from "lib/hooks/useCurrencyBalance";
import { useIsMobile } from "nft/hooks";
import { darken } from "polished";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "rebass/styled-components";
import {
  useDepositHMTModal,
  useDepositVHMTModal,
  useModalIsOpen,
  useToggleDelegateModal,
} from "state/application/hooks";
import { ApplicationModal } from "state/application/reducer";
import { ProposalData, useUserVotesByAddress } from "state/governance/hooks";
import {
  useAllDelegateData,
  useAllProposalData,
  useTotalSupply,
  useUserDelegatee,
  useUserVotes,
} from "state/governance/hooks";
import styled from "styled-components/macro";
import { ExternalLink, ThemedText } from "theme";
import { shortenAddress } from "utils";
import { shortenString } from "utils";
import { checkProposalState } from "utils/checkProposalPendingState";
import { ExplorerDataType, getExplorerLink } from "utils/getExplorerLink";
import { shortenTitle } from "utils/shortenTitle";

import { ZERO_ADDRESS } from "../../constants/misc";
import { UNI } from "../../constants/tokens";
import { ProposalStatus } from "./styled";

const PageWrapper = styled(AutoColumn)`
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
    padding-top: 20px;
  }
`;
const DelegateContainer = styled(RowBetween)`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
  flex-wrap: wrap;
`};
`;
const DelegateHeader = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  margin: 0px 12px 0 0;
  padding: 28px 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  background-color: ${({ theme }) => theme.white};
`;
const DelegateBody = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  margin: 0px 12px 0 0;
  padding: 15px 16px;
  background: ${({ theme }) => theme.white};

  &:hover {
    background-color: ${({ theme }) => theme.backgroundInteractive};
  }

  @media only screen and (max-width: ${({ theme }) =>
      `${theme.breakpoint.sm}px`}) {
    width: 100%;
    font-size: 10px;
    padding: 0.4rem 0.5rem;
    align-items: center;
  }
`;

const DelegateButton = styled(ButtonPrimary)`
   {
    width: 147px;
    height: 42px;
    margin-left: auto;
    background: ${({ theme }) => theme.textSecondary};

    @media only screen and (max-width: ${({ theme }) =>
        `${theme.breakpoint.xs}px`}) {
      width: 90%;
      margin: 0 auto;
      font-size: 10px;
      > button {
        width: 204px !important;
      }
    }
  }
`;

const ProposalsContainer = styled(AutoColumn)`
  max-width: 820px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media only screen and (max-width: ${({ theme }) =>
      `${theme.breakpoint.sm}px`}) {
    gap: 12px;
    padding: 0 16px;
  }

  @media only screen and (max-width: ${({ theme }) =>
      `${theme.breakpoint.xs}px`}) {
    padding: unset;
  }
`;

const Proposal = styled(Button)`
  width: 100%;
  display: flex;
  align-items: center;
  text-align: left;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  font-size: 14px;
  background-color: ${({ theme }) => theme.white};

  &:focus {
    background-color: ${({ theme }) => darken(0.05, theme.deprecated_bg1)};
  }
  &:hover {
    background-color: ${({ theme }) => theme.backgroundInteractive};
  }

  @media only screen and (max-width: ${({ theme }) =>
      `${theme.breakpoint.sm}px`}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const ProposalNumber = styled.span`
  flex: 0 0 40px;
  margin-right: 20px;
  color: ${({ theme }) => theme.textPrimary};
  font-weight: 600;

  @media only screen and (max-width: ${({ theme }) =>
      `${theme.breakpoint.md}px`}) {
    margin-right: 10px;
  }
`;

const ProposalTitle = styled.span`
  flex: 1;
  padding: 0 24px 0 10px;
  white-space: initial;
  word-wrap: break-word;
  font-weight: 400;

  @media only screen and (max-width: ${({ theme }) =>
      `${theme.breakpoint.sm}px`}) {
    padding-right: 0;
    padding-top: 12px;
    padding-left: 0;
  }
`;

const WrapSmall = styled(RowBetween)`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex-wrap: wrap;
  `};
`;

const AddressButton = styled.div`
  padding: 2px 4px;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${({ theme }) => theme.accentAction};
`;

const StyledExternalLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.textPrimary};
`;

const StyledButtonsContainer = styled(AutoRow)`
  flex-wrap: nowrap;
  white-space: nowrap;
  margin: 0;

  @media only screen and (max-width: ${({ theme }) =>
      `${theme.breakpoint.xs}px`}) {
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const StyledButtonPrimary = styled(ButtonPrimary)`
  width: 200px;
  height: 42px;
  margin-left: auto;
  padding: 8px;
  transition: 0.3s;

  @media only screen and (max-width: ${({ theme }) =>
      `${theme.breakpoint.md}px`}) {
    font-size: 16px;
  }

  @media only screen and (max-width: ${({ theme }) =>
      `${theme.breakpoint.sm}px`}) {
    font-size: 14px;
    width: 50%;
  }

  @media only screen and (max-width: ${({ theme }) =>
      `${theme.breakpoint.xs}px`}) {
    width: 85%;
  }
`;

const StyledRowBetween = styled(RowBetween)`
  @media only screen and (max-width: ${({ theme }) =>
      `${theme.breakpoint.xs}px`}) {
    display: flex;
    flex-direction: column;
    align-items: unset;
    gap: 10px;
    margin-bottom: 20px;
  }
`;

const UnlockVotingContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  margin: 28px 12px 0 0;
  padding: 15px 16px;
  background: ${({ theme }) => theme.white};

  > button {
    width: 147px;
    height: 42px;
    margin-left: auto;
    background: ${({ theme }) => theme.textSecondary};

    @media only screen and (max-width: ${({ theme }) =>
        `${theme.breakpoint.xs}px`}) {
      width: 90%;
      margin: 0 auto;

      > button {
        width: 204px !important;
      }
    }
  }

  @media only screen and (max-width: ${({ theme }) =>
      `${theme.breakpoint.xs}px`}) {
    flex-direction: column;
    gap: 10px;
  }
`;

export default function Landing() {
  const { account, chainId } = useWeb3React();
  const isMobile = useIsMobile();
  const hubBlock = useHubBlockNumber();

  const showDelegateModal = useModalIsOpen(ApplicationModal.DELEGATE);
  const toggleDelegateModal = useToggleDelegateModal();

  const showDepositHMTModal = useModalIsOpen(ApplicationModal.DEPOSIT_HMT);
  const toggleDepositHMTModal = useDepositHMTModal();

  const showDepositVHMTModal = useModalIsOpen(ApplicationModal.DEPOSIT_VHMT);
  const toggleDepositVHMTModal = useDepositVHMTModal();

  // get data to list all proposals
  const { data: allProposals } = useAllProposalData();

  // get data to list all delegate
  const { data: allDelagateData } = useAllDelegateData();

  // get data to list totalSupply
  const { data: getTotalSupply } = useTotalSupply();

  const { filterData: votes } = useUserVotesByAddress(
    allDelagateData,
    getTotalSupply
  );

  // get data to list user votes
  const { availableVotes } = useUserVotes();

  const hmtContractToken = useHmtContractToken();

  const uniBalance: CurrencyAmount<Token> | undefined = useTokenBalance(
    account ?? undefined,
    chainId ? UNI[chainId] : undefined
  );

  const hmtBalance: CurrencyAmount<Token> | undefined = useTokenBalance(
    account ?? undefined,
    chainId ? hmtContractToken : undefined
  );
  const [addressToTransfer, setAddressToTransfer] = useState<string>("");
  const [isTransferToOther, setTransferToOther] = useState<boolean>(false);
  function onAddressChange(value: string) {
    setAddressToTransfer(value);
  }

  const { userDelegatee }: { userDelegatee: string; isLoading: boolean } =
    useUserDelegatee();

  // show delegation option if they have have a balance, but have not delegated
  const showUnlockVoting = Boolean(
    uniBalance &&
      userDelegatee &&
      JSBI.notEqual(uniBalance.quotient, JSBI.BigInt(0)) &&
      userDelegatee[0] === ZERO_ADDRESS
  );

  // show this button if user have any HMT currency on his account so he can exchange it to vHMT
  const showDepositHMTButton = Boolean(
    hmtBalance && JSBI.notEqual(hmtBalance.quotient, JSBI.BigInt(0))
  );

  // show this button if user have any vHMT currency on his account so he can exchange it to HMT
  const showDepositVHMTButton = Boolean(
    uniBalance && JSBI.notEqual(uniBalance.quotient, JSBI.BigInt(0))
  );

  return (
    <>
      <PageWrapper gap="lg" justify="center">
        <DelegateModal
          accountAddress={isTransferToOther ? addressToTransfer : account}
          isOpen={showDelegateModal}
          onDismiss={toggleDelegateModal}
          title={
            showUnlockVoting ? (
              <Trans>Unlock Votes</Trans>
            ) : (
              <Trans>Update Delegation</Trans>
            )
          }
        />
        <DepositHMTModal
          isOpen={showDepositHMTModal}
          onDismiss={toggleDepositHMTModal}
          title={showDepositHMTButton && <Trans>Deposit HMT</Trans>}
          hmtBalance={hmtBalance}
        />

        <DepositVHMTModal
          isOpen={showDepositVHMTModal}
          onDismiss={toggleDepositVHMTModal}
          title={showDepositVHMTButton && <Trans>Withdraw HMT</Trans>}
          uniBalance={uniBalance}
        />
        <ProposalsContainer gap="2px">
          <WrapSmall>
            <StyledButtonsContainer gap="6px" justify="flex-end">
              <StyledButtonPrimary
                disabled={!showDepositHMTButton}
                onClick={toggleDepositHMTModal}
              >
                <Trans>Deposit HMT</Trans>
              </StyledButtonPrimary>
              <StyledButtonPrimary
                disabled={!showDepositVHMTButton}
                onClick={toggleDepositVHMTModal}
              >
                <Trans>Withdraw HMT</Trans>
              </StyledButtonPrimary>
            </StyledButtonsContainer>

            {/* Delegate to self, , comment out the showUnlockVoting variable so it will shows all the time */}
            {/* {showUnlockVoting ? ( */}
            <UnlockVotingContainer>
              <ThemedText.BodySecondary fontWeight={500} mr="4px">
                <Trans>Self Delegate to unlock voting</Trans>
              </ThemedText.BodySecondary>
              <StyledButtonPrimary
                onClick={() => {
                  toggleDelegateModal();
                  setTransferToOther(false);
                }}
              >
                <Trans>Delegate</Trans>
              </StyledButtonPrimary>
            </UnlockVotingContainer>
            {/* ) : null} */}
            {/* Delegate to someone, , comment out the showUnlockVoting variable so it will shows all the time */}
            {/* {showUnlockVoting ? ( */}
            <UnlockVotingContainer>
              <ThemedText.BodySecondary fontWeight={500} mr="4px">
                <Trans>Delegate to another address</Trans>
              </ThemedText.BodySecondary>

              <TransferAddressInput
                value={addressToTransfer}
                onChange={onAddressChange}
                className="hmt-deposit-input"
              />
              <StyledButtonPrimary
                onClick={() => {
                  toggleDelegateModal();
                  setTransferToOther(true);
                }}
              >
                <Trans>Delegate</Trans>
              </StyledButtonPrimary>
            </UnlockVotingContainer>
            {/* ) : null} */}
          </WrapSmall>

          {/* After delegate , after delegate it will shows the latest address delegate to*/}
          {/* {!showUnlockVoting && ( */}
          <RowBetween>
            {userDelegatee && userDelegatee[0] !== ZERO_ADDRESS && chainId ? (
              <StyledRowBetween justify="between">
                <RowFixed>
                  <ThemedText.SubHeaderLarge mr="4px">
                    <Trans>Delegated to:</Trans>
                  </ThemedText.SubHeaderLarge>
                  <AddressButton>
                    <StyledExternalLink
                      href={getExplorerLink(
                        chainId,
                        userDelegatee,
                        ExplorerDataType.ADDRESS
                      )}
                      style={{ margin: "0 4px" }}
                    >
                      {shortenAddress(userDelegatee[0])}{" "}
                      <Trans>
                        {userDelegatee[0] == account ? "(self)" : "(other)"}
                      </Trans>
                    </StyledExternalLink>
                  </AddressButton>
                </RowFixed>

                {availableVotes &&
                JSBI.notEqual(JSBI.BigInt(0), availableVotes?.quotient) ? (
                  <RowFixed>
                    <ThemedText.SubHeaderLarge mr="6px">
                      {uniBalance?.toExact()} <Trans>Votes</Trans>
                    </ThemedText.SubHeaderLarge>
                  </RowFixed>
                ) : uniBalance &&
                  userDelegatee &&
                  userDelegatee[0] !== ZERO_ADDRESS &&
                  JSBI.notEqual(JSBI.BigInt(0), uniBalance?.quotient) ? (
                  <RowFixed>
                    <ThemedText.DeprecatedBody fontWeight={500} mr="6px">
                      {uniBalance?.toExact()} <Trans>Votes</Trans>
                    </ThemedText.DeprecatedBody>
                  </RowFixed>
                ) : (
                  ""
                )}
              </StyledRowBetween>
            ) : (
              ""
            )}
          </RowBetween>
          {/* )} */}

          <ThemedText.HeadlineLarge
            style={{ margin: "28px 0 12px 0", flexShrink: 0 }}
          >
            <Trans>Top Delegates</Trans>
          </ThemedText.HeadlineLarge>
          <DelegateContainer>
            <DelegateHeader>
              <AutoRow>Address</AutoRow>
              <AutoRow>Voting Power</AutoRow>
              <AutoRow>vHMT</AutoRow>
              <AutoRow></AutoRow>
            </DelegateHeader>

            {getTotalSupply &&
              votes &&
              votes?.map((item: any) => {
                return (
                  <DelegateBody key={item.acc}>
                    <AutoRow>{shortenString(item.acc)}</AutoRow>
                    <AutoRow>{item.votepercentage} %</AutoRow>
                    <AutoRow>{item.votepower + " vHMT"}</AutoRow>
                    <AutoRow>
                      <DelegateButton
                        onClick={() => {
                          toggleDelegateModal();
                          setTransferToOther(true);
                          setAddressToTransfer(item.acc);
                        }}
                      >
                        <Trans>Delegate</Trans>
                      </DelegateButton>
                    </AutoRow>
                    {/* </DelegateButton> */}
                  </DelegateBody>
                );
              })}
          </DelegateContainer>

          <ThemedText.HeadlineLarge
            style={{ margin: "28px 0 12px 0", flexShrink: 0 }}
          >
            <Trans>Proposal</Trans>
          </ThemedText.HeadlineLarge>
          {allProposals?.length === 0 && <ProposalEmptyState />}
          {allProposals &&
            allProposals
              ?.slice(0)
              ?.reverse()
              ?.map((p: ProposalData) => {
                return isMobile ? (
                  <Proposal
                    as={Link}
                    to={`/${p.governorIndex}/${p.id}`}
                    key={`${p.governorIndex}${p.id}`}
                  >
                    <RowBetween>
                      <ProposalNumber>{shortenString(p.id)}</ProposalNumber>
                      <ProposalStatus
                        status={checkProposalState(
                          p.status,
                          hubBlock,
                          p.endBlock
                        )}
                      />
                    </RowBetween>
                    <ProposalTitle>{shortenTitle(p.title)}</ProposalTitle>
                  </Proposal>
                ) : (
                  <Proposal
                    as={Link}
                    to={`/${p.governorIndex}/${p.id}`}
                    key={`${p.governorIndex}${p.id}`}
                  >
                    <ProposalNumber>{shortenString(p.id)}</ProposalNumber>
                    <ProposalTitle>{shortenTitle(p.title)}</ProposalTitle>
                    <ProposalStatus
                      status={checkProposalState(
                        p.status,
                        hubBlock,
                        p.endBlock
                      )}
                    />
                  </Proposal>
                );
              })}
        </ProposalsContainer>
      </PageWrapper>
    </>
  );
}
