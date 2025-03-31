import { FC } from 'react';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import TelegramIcon from '@mui/icons-material/Telegram';
import { styled } from '@mui/material/styles';

import { colorPalette } from '../../assets/styles/color-palette';
import DiscordIcon from '../../assets/DiscordIcon';

const SocialMediaIconButton = styled(IconButton)({
  padding: 0,
  color: colorPalette.sky.main,

  '&:hover': {
    background: 'none',
    color: 'inherit',
  },
});

const Footer: FC = () => {
  const handleClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <footer>
      <div className="footer-wrapper">
        <div className="footer-link-wrapper">
          <div className="footer-link">
            <Typography
              component="span"
              color="text.secondary"
              onClick={() =>
                handleClick(import.meta.env.VITE_FOOTER_LINK_PRIVACY_POLICY)
              }
            >
              Privacy Policy
            </Typography>
            <Typography
              component="span"
              color="text.secondary"
              onClick={() =>
                handleClick(import.meta.env.VITE_FOOTER_LINK_TERMS_OF_SERVICE)
              }
            >
              Terms of Service
            </Typography>
            <Typography
              component="span"
              color="text.secondary"
              onClick={() =>
                handleClick(import.meta.env.VITE_FOOTER_LINK_HUMAN_PROTOCOL)
              }
            >
              HUMAN Protocol
            </Typography>
          </div>
          <Typography variant="subtitle1" color="text.secondary">
            © 2025 HPF. HUMAN Protocol® is a registered trademark
          </Typography>
        </div>
        <div className="footer-icon">
          <SocialMediaIconButton
            aria-label="GitHub"
            onClick={() => handleClick(import.meta.env.VITE_FOOTER_LINK_GITHUB)}
          >
            <GitHubIcon />
          </SocialMediaIconButton>

          <SocialMediaIconButton
            aria-label="Discord"
            onClick={() =>
              handleClick(import.meta.env.VITE_FOOTER_LINK_DISCORD)
            }
          >
            <DiscordIcon />
          </SocialMediaIconButton>

          <SocialMediaIconButton
            aria-label="X"
            onClick={() => handleClick(import.meta.env.VITE_FOOTER_LINK_X)}
          >
            <TwitterIcon />
          </SocialMediaIconButton>

          <SocialMediaIconButton
            aria-label="Telegram"
            onClick={() =>
              handleClick(import.meta.env.VITE_FOOTER_LINK_TELEGRAM)
            }
          >
            <TelegramIcon />
          </SocialMediaIconButton>

          <SocialMediaIconButton
            aria-label="LinkedIn"
            onClick={() =>
              handleClick(import.meta.env.VITE_FOOTER_LINK_LINKEDIN)
            }
          >
            <LinkedInIcon />
          </SocialMediaIconButton>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
