import { t } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import GrayCloseButton from 'components/GrayCloseButton/GrayCloseButton'
import Modal from 'components/Modal'
import { MouseoverTooltip } from 'components/Tooltip'
import { HUB_CHAIN_ID } from 'constants/addresses'
import { GOVERNANCE_SPOKE_ADRESSES } from 'constants/addresses'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useSelectChain from 'hooks/useSelectChain'
import useSyncChainQuery from 'hooks/useSyncChainQuery'
import { Box } from 'nft/components/Box'
import { Portal } from 'nft/components/common/Portal'
import { Column, Row } from 'nft/components/Flex'
import { ArrowDown, ArrowUp } from 'nft/components/icons'
import { useIsMobile } from 'nft/hooks'
import { useCallback, useRef, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'

import * as styles from './ChainSelector.css'
import ChainSelectorRow from './ChainSelectorRow'
import { NavDropdown } from './NavDropdown'

const NETWORK_SELECTOR_CHAINS = [HUB_CHAIN_ID, ...Object.keys(GOVERNANCE_SPOKE_ADRESSES).map(Number)]

interface ChainSelectorProps {
  leftAlign?: boolean
}

const ChainSelectorContainer = styled(Box)`
  border-radius: ${({ theme }) => theme.border.normal};
`

const ChainSelectorMainWrapper = styled('div')`
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 16px 16px 16px;

  > button:nth-child(1) {
    margin: 16px auto;
  }
`

export const ChainSelector = ({ leftAlign }: ChainSelectorProps) => {
  const { chainId } = useWeb3React()

  const [isOpen, setIsOpen] = useState<boolean>(false)
  const isMobile = useIsMobile()

  const theme = useTheme()

  const ref = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => !isMobile && setIsOpen(false), [modalRef])

  const info = chainId ? getChainInfo(chainId) : undefined

  const selectChain = useSelectChain()
  useSyncChainQuery()

  const [pendingChainId, setPendingChainId] = useState<SupportedChainId | undefined>(undefined)

  const onSelectChain = useCallback(
    async (targetChainId: SupportedChainId) => {
      setPendingChainId(targetChainId)
      await selectChain(targetChainId)
      setPendingChainId(undefined)
      setIsOpen(false)
    },
    [selectChain, setIsOpen]
  )

  if (!chainId) return null

  const isSupported = !!info

  const dropdown = isMobile ? (
    <Modal isOpen={true} maxHeight={90} onDismiss={() => setIsOpen(false)}>
      <ChainSelectorMainWrapper>
        <GrayCloseButton onClick={() => setIsOpen(false)} />
        {NETWORK_SELECTOR_CHAINS.map((chainId: SupportedChainId) => (
          <ChainSelectorRow
            onSelectChain={onSelectChain}
            targetChain={chainId}
            key={chainId}
            isPending={chainId === pendingChainId}
          />
        ))}
      </ChainSelectorMainWrapper>
    </Modal>
  ) : (
    <NavDropdown top="56" left={leftAlign ? '0' : 'auto'} right={leftAlign ? 'auto' : '0'} ref={modalRef}>
      <Column paddingX="8">
        {NETWORK_SELECTOR_CHAINS.map((chainId: SupportedChainId) => (
          <ChainSelectorRow
            onSelectChain={onSelectChain}
            targetChain={chainId}
            key={chainId}
            isPending={chainId === pendingChainId}
          />
        ))}
      </Column>
    </NavDropdown>
  )

  const chevronProps = {
    height: 20,
    width: 20,
    color: theme.textSecondary,
  }

  return (
    <ChainSelectorContainer position="relative" ref={ref}>
      <MouseoverTooltip text={t`Your wallet's current network is unsupported.`} disabled={isSupported}>
        <Row
          as="button"
          gap="8"
          className={styles.ChainSelector}
          background={isOpen ? 'accentActiveSoft' : 'none'}
          onClick={() => setIsOpen(!isOpen)}
        >
          {!isSupported ? (
            <AlertTriangle size={20} color={theme.textSecondary} />
          ) : (
            <img src={info.logoUrl} alt={info.label} className={styles.Image} data-testid="chain-selector-logo" />
          )}
          {isOpen ? <ArrowUp {...chevronProps} /> : <ArrowDown {...chevronProps} />}
        </Row>
      </MouseoverTooltip>
      {isOpen && (isMobile ? <Portal>{dropdown}</Portal> : <>{dropdown}</>)}
    </ChainSelectorContainer>
  )
}
