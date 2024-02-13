import { useWeb3React } from '@web3-react/core'
import Column from 'components/Column'
import WalletModal from 'components/WalletModal'
import styled from 'styled-components/macro'

import AuthenticatedHeader from './AuthenticatedHeader'

const DefaultMenuWrap = styled(Column)`
  width: 100%;
  height: 100%;
`

function DefaultMenu() {
  const { account } = useWeb3React()
  const isAuthenticated = !!account

  return (
    <DefaultMenuWrap>{isAuthenticated ? <AuthenticatedHeader account={account} /> : <WalletModal />}</DefaultMenuWrap>
  )
}

export default DefaultMenu
