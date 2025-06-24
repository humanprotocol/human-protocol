import { FC } from 'react';

import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TelegramIcon from '@mui/icons-material/Telegram';
import TwitterIcon from '@mui/icons-material/Twitter';
import { IconButton, styled } from '@mui/material';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { env } from '@/shared/config/env';
import DiscordIcon from '@/shared/ui/icons/DiscordIcon';

const StyledLink = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: theme.palette.text.secondary,
  '&:visited': {
    color: theme.palette.text.secondary,
  },
}));

const SocialMediaIconButton = styled(IconButton)(({ theme }) => ({
  padding: 0,
  color: theme.palette.text.secondary,

  '&:hover': {
    background: 'none',
    color: 'inherit',
  },
  '& > svg': {
    fontSize: '32px',
  },
}));

const Footer: FC = () => {
  const handleClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Box
      component="footer"
      minHeight="124px"
      mt="auto"
      bgcolor={{ xs: 'white.dark', md: 'white.main' }}
      px={{ xs: 3, md: 0 }}
    >
      <Box
        display="flex"
        flexDirection={{ xs: 'column-reverse', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        py={4}
        px={2}
      >
        <Box display="flex" flexDirection="column" gap={3}>
          <Box
            display="flex"
            alignItems="flex-start"
            gap={3}
            flexDirection={{ xs: 'column', md: 'row' }}
            flexWrap="wrap"
          >
            <StyledLink
              variant="caption"
              href={env.VITE_FOOTER_LINK_PRIVACY_POLICY}
            >
              Privacy Policy
            </StyledLink>
            <StyledLink
              variant="caption"
              href={env.VITE_FOOTER_LINK_TERMS_OF_SERVICE}
            >
              Terms of Service
            </StyledLink>
            <StyledLink
              variant="caption"
              href={env.VITE_FOOTER_LINK_HUMAN_PROTOCOL}
            >
              HUMAN Protocol
            </StyledLink>
          </Box>
          <Typography component="span" variant="caption" color="text.secondary">
            © 2021 HPF. HUMAN Protocol® is a registered trademark
          </Typography>
        </Box>
        <Box
          display="flex"
          flexWrap="wrap"
          gap={4}
          mb={{ xs: 4, md: 0 }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent={{ xs: 'space-between', sm: 'flex-start' }}
          width={{ xs: '100%', sm: 'auto' }}
        >
          <SocialMediaIconButton
            aria-label="GitHub"
            onClick={() => handleClick(env.VITE_FOOTER_LINK_GITHUB)}
          >
            <GitHubIcon />
          </SocialMediaIconButton>
          <SocialMediaIconButton
            aria-label="Discord"
            onClick={() => handleClick(env.VITE_FOOTER_LINK_DISCORD)}
          >
            <DiscordIcon />
          </SocialMediaIconButton>
          <SocialMediaIconButton
            aria-label="X"
            onClick={() => handleClick(env.VITE_FOOTER_LINK_X)}
          >
            <TwitterIcon />
          </SocialMediaIconButton>
          <SocialMediaIconButton
            aria-label="Telegram"
            onClick={() => handleClick(env.VITE_FOOTER_LINK_TELEGRAM)}
          >
            <TelegramIcon />
          </SocialMediaIconButton>
          <SocialMediaIconButton
            aria-label="LinkedIn"
            onClick={() => handleClick(env.VITE_FOOTER_LINK_LINKEDIN)}
          >
            <LinkedInIcon />
          </SocialMediaIconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;
