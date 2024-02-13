import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const BannerWrapper = styled.div`
  width: 100%;
  height: ${({ theme }) => theme.navHeight}px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 60px;
  z-index: 2;
  background-color: ${({ theme }) => theme.banner};

  > div {
    font-size: 24px;
    color: white;

    @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
      font-size: 16px;
    }
  }
`

const Banner = () => {
  return (
    <BannerWrapper>
      <ThemedText.BodySecondary>This is a testing version</ThemedText.BodySecondary>
    </BannerWrapper>
  )
}

export default Banner
