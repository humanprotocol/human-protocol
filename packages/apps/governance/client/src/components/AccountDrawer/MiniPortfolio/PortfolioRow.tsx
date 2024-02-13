import Column, { AutoColumn } from 'components/Column'
import Row from 'components/Row'
import styled from 'styled-components/macro'

const PortfolioRowWrapper = styled(Row)<{ onClick?: any }>`
  gap: 12px;
  height: 68px;
  padding: 0 16px;

  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} background-color`};

  ${({ onClick }) => onClick && 'cursor: pointer'};

  &:hover {
    cursor: pointer;
  }
`

const EndColumn = styled(Column)`
  align-items: flex-end;
`

export default function PortfolioRow({
  left,
  title,
  descriptor,
  right,
  onClick,
}: {
  left: React.ReactNode
  title: React.ReactNode
  descriptor?: React.ReactNode
  right?: React.ReactNode
  setIsHover?: (b: boolean) => void
  onClick?: () => void
}) {
  return (
    <PortfolioRowWrapper onClick={onClick}>
      {left}
      <AutoColumn grow>
        {title}
        {descriptor}
      </AutoColumn>
      {right && <EndColumn>{right}</EndColumn>}
    </PortfolioRowWrapper>
  )
}
