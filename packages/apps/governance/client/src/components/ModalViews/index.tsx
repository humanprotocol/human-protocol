import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { useIsMobile } from 'nft/hooks'
import { CheckCircle, XCircle } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'

import Circle from '../../assets/images/blue-loader.svg'
import { CloseIcon, CustomLightSpinner, ThemedText } from '../../theme'
import { ExternalLink } from '../../theme/components'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { AutoColumn, ColumnCenter } from '../Column'
import { RowBetween } from '../Row'

const ConfirmOrLoadingWrapper = styled.div<{ gap?: boolean }>`
  display: flex;
  position: relative;
  flex-direction: column;
  width: 100%;
  padding-top: 24px;
  margin-bottom: 24px;
  gap: ${({ gap }) => (gap ? '32px' : 0)};
`

const StyledRowBetween = styled(RowBetween)`
  > div:nth-child(1) {
    display: flex;
    justify-content: center;
    width: 100%;
    font-size: 28px;

    @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.xs}px`}) {
      font-size: 24px;
    }
  }
`

const CloseIconWrapper = styled('div')`
  position: absolute;
  right: 10px;
  display: block;
  margin-left: 20px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    display: none;
  }
`

const ConfirmedIcon = styled(ColumnCenter)`
  padding: 0 0 32px 0;
`

export function LoadingView({
  children,
  onDismiss,
  label = 'Submitting Vote',
}: {
  children: any
  onDismiss: () => void
  label?: string
}) {
  const isMobile = useIsMobile()

  return (
    <ConfirmOrLoadingWrapper gap>
      <StyledRowBetween>
        <ThemedText.HeadlineLarge>{label}</ThemedText.HeadlineLarge>
        <CloseIconWrapper>
          <CloseIcon onClick={onDismiss} />
        </CloseIconWrapper>
      </StyledRowBetween>
      <ColumnCenter>
        <CustomLightSpinner src={Circle} alt="loader" size={isMobile ? '90px' : '116px'} />
      </ColumnCenter>
      <AutoColumn gap="100px" justify="center">
        {children}
      </AutoColumn>
    </ConfirmOrLoadingWrapper>
  )
}

export function SubmittedView({
  children,
  onDismiss,
  hash,
}: {
  children: any
  onDismiss: () => void
  hash: string | undefined
}) {
  const theme = useTheme()
  const { chainId } = useWeb3React()
  const isMobile = useIsMobile()

  return (
    <ConfirmOrLoadingWrapper>
      <RowBetween>
        <CloseIconWrapper>
          <CloseIcon onClick={onDismiss} />
        </CloseIconWrapper>
      </RowBetween>
      <ConfirmedIcon>
        <CheckCircle strokeWidth={0.7} size={isMobile ? 116 : 190} color={theme.accentSuccess} />
      </ConfirmedIcon>
      <AutoColumn gap={isMobile ? '24px' : '48px'} justify="center">
        {children}
        {chainId && hash && (
          <ExternalLink
            href={getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)}
            style={{ marginLeft: '4px' }}
          >
            <ThemedText.DeprecatedSubHeader>
              <Trans>View transaction on Explorer</Trans>
            </ThemedText.DeprecatedSubHeader>
          </ExternalLink>
        )}
      </AutoColumn>
    </ConfirmOrLoadingWrapper>
  )
}

export function SubmittedWithErrorView({ children, onDismiss }: { children: any; onDismiss: () => void }) {
  const theme = useTheme()
  const isMobile = useIsMobile()

  return (
    <ConfirmOrLoadingWrapper>
      <AutoColumn justify="center">
        <RowBetween>
          <CloseIconWrapper>
            <CloseIcon onClick={onDismiss} />
          </CloseIconWrapper>
        </RowBetween>
        <ColumnCenter>
          <XCircle strokeWidth={0.7} size={isMobile ? 116 : 190} color={theme.accentFailure} />
        </ColumnCenter>
        {children}
      </AutoColumn>
    </ConfirmOrLoadingWrapper>
  )
}
