import { useWeb3React } from '@web3-react/core'
import StatusIcon from 'components/Identicon/StatusIcon'
import { getConnection } from 'connection'
import { LogoutIcon } from 'nft/components/icons'
import { useCallback } from 'react'
import { Copy } from 'react-feather'
import { useAppDispatch } from 'state/hooks'
import { updateSelectedWallet } from 'state/user/reducer'
import styled from 'styled-components/macro'
import { CopyHelper, ThemedText } from 'theme'

import { shortenAddress } from '../../nft/utils/address'
import IconButton, { IconHoverText } from './IconButton'

const AuthenticatedHeaderWrapper = styled.div`
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
`

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  & > a,
  & > button {
    margin-right: 8px;
  }

  & > button:last-child {
    margin-right: 0px;
    ${IconHoverText}:last-child {
      left: 0px;
    }
  }
`

const StatusWrapper = styled.div`
  display: inline-block;
  width: 70%;
  padding-right: 4px;
  display: inline-flex;
`

const AccountNamesWrapper = styled.div`
  overflow: hidden;
  white-space: nowrap;
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: center;
  gap: 2px;

  > div {
    font-weight: 700;
  }
`

const HeaderWrapper = styled.div`
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`

const CopyText = styled(CopyHelper).attrs({
  InitialIcon: Copy,
  CopiedIcon: Copy,
  gap: 4,
  iconSize: 14,
  iconPosition: 'right',
})``

export default function AuthenticatedHeader({ account }: { account: string }) {
  const { connector, ENSName } = useWeb3React()
  const dispatch = useAppDispatch()
  const connection = getConnection(connector)

  const disconnect = useCallback(() => {
    if (connector && connector.deactivate) {
      connector.deactivate()
    }
    connector.resetState()
    dispatch(updateSelectedWallet({ wallet: undefined }))
  }, [connector, dispatch])

  return (
    <AuthenticatedHeaderWrapper>
      <HeaderWrapper>
        <StatusWrapper>
          <StatusIcon connection={connection} size={40} />
          {account && (
            <AccountNamesWrapper>
              <ThemedText.SubHeader>
                <CopyText toCopy={ENSName ?? account}>{ENSName ?? shortenAddress(account, 4, 4)}</CopyText>
              </ThemedText.SubHeader>
              {/* Displays smaller view of account if ENS name was rendered above */}
              {ENSName && (
                <ThemedText.BodySmall color="textTertiary">
                  <CopyText toCopy={account}>{shortenAddress(account, 4, 4)}</CopyText>
                </ThemedText.BodySmall>
              )}
            </AccountNamesWrapper>
          )}
        </StatusWrapper>
        <IconContainer>
          <IconButton data-testid="wallet-disconnect" onClick={disconnect} Icon={LogoutIcon} />
        </IconContainer>
      </HeaderWrapper>
    </AuthenticatedHeaderWrapper>
  )
}
