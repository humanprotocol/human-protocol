import { Box } from 'rebass/styled-components'
import styled from 'styled-components/macro'

const Card = styled(Box)<{ width?: string; padding?: string; border?: string; $borderRadius?: string }>`
  width: ${({ width }) => width ?? '100%'};
  padding: ${({ padding }) => padding ?? '1rem'};
  border-radius: ${({ $borderRadius }) => $borderRadius ?? '16px'};
  border: ${({ border }) => border};
`

export const GrayCard = styled(Card)`
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: ${({ theme }) => theme.accentAction};
  color: ${({ theme }) => theme.white};
`
