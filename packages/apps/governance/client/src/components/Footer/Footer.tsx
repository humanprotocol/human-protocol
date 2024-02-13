import { Trans } from '@lingui/macro'
import { useScreenSize } from 'hooks/useScreenSize'
import { DiscordIcon, GithubIconMenu, LinkedinIcon, TwitterIcon, YoutubeIcon } from 'nft/components/icons'
import styled from 'styled-components/macro'

const SOCIAL_MEDIA = [
  { icon: <TwitterIcon />, link: 'http://hmt.ai/twitter' },
  { icon: <DiscordIcon />, link: 'http://hmt.ai/discord' },
  { icon: <GithubIconMenu />, link: 'http://hmt.ai/github' },
  { icon: <LinkedinIcon />, link: 'http://hmt.ai/linkedin' },
  { icon: <YoutubeIcon />, link: 'https://www.youtube.com/@HUMANProtocol' },
]

const TERMS_AND_CONDITIONS_LINK = 'https://www.humanprotocol.org/protocol-disclaimer'

const MainContainer = styled.footer`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  z-index: 2;
  padding: 24px 96px;
  color: ${({ theme }) => theme.accentGray};
  font-size: 12px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    flex-direction: column;
    align-items: unset;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding: 50px 24px 32px 24px;
  }
`

const LabelsContainer = styled.div`
  display: flex;
  flex-direction: column;
  order: -1;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    order: 5;
  }
`

const TermsContainer = styled.div`
  display: flex;
  height: 24px;
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    order: 1;
  }
`

const CopyrightContainer = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  height: 24px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
    position: unset;
    transform: translateX(0);
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    order: 2;
  }
`

const SocialMediaContainer = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
  gap: 25px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    order: 0;
    margin-bottom: 32px;
    margin-left: unset;
  }
`

const StyledLink = styled.a`
  text-decoration: none;
`

const Footer = () => {
  const isScreenSize = useScreenSize()

  const mobileFooter = !isScreenSize.lg && !isScreenSize.xl && !isScreenSize.xxl && !isScreenSize.xxxl

  return (
    <MainContainer>
      {mobileFooter ? (
        <>
          <LabelsContainer>
            <TermsContainer>
              <Trans>Terms and conditions</Trans>
            </TermsContainer>
            <CopyrightContainer>
              © 2021 HPF. HUMAN Protocol® <Trans>is a registered trademark</Trans>
            </CopyrightContainer>
          </LabelsContainer>

          <SocialMediaContainer>
            {SOCIAL_MEDIA.map(({ icon, link }, i) => (
              <a key={i} href={link} target="_blank" rel="noreferrer">
                {icon}
              </a>
            ))}
          </SocialMediaContainer>
        </>
      ) : (
        <>
          <TermsContainer>
            <StyledLink href={TERMS_AND_CONDITIONS_LINK} target="_blank" rel="noreferrer">
              <Trans>Terms and conditions</Trans>
            </StyledLink>
          </TermsContainer>
          <CopyrightContainer>
            © 2021 HPF. HUMAN Protocol® <Trans>is a registered trademark</Trans>
          </CopyrightContainer>

          <SocialMediaContainer>
            {SOCIAL_MEDIA.map(({ icon, link }, i) => (
              <a key={i} href={link} target="_blank" rel="noreferrer">
                {icon}
              </a>
            ))}
          </SocialMediaContainer>
        </>
      )}
    </MainContainer>
  )
}

export default Footer
