import styled from 'styled-components/macro'

const GrayButton = styled('button')`
  display: none;
  width: 30px;
  height: 6px;
  margin: 0 auto;
  border-radius: 12px;
  border: none;
  background: ${({ theme }) => theme.backgroundLightGray};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    display: flex;
    justify-content: center;
  }
`

interface GrayCloseButtonProps {
  onClick?: () => void
}

export default function GrayCloseButton({ onClick }: GrayCloseButtonProps) {
  return <GrayButton onClick={onClick} />
}
