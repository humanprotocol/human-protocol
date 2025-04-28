import { FC } from 'react';

import {
  Box,
  IconButton,
  Link,
  styled,
  Typography,
  useTheme,
} from '@mui/material';
import { Twitter, LinkedIn, GitHub, Telegram } from '@mui/icons-material';

import Container from '../Container';
import { DiscordIcon } from '../../icons';

const SocialMediaIconButton = styled(IconButton)(({ theme }) => ({
  padding: 0,
  color: theme.palette.text.secondary,

  '&:hover': {
    background: 'none',
    color: 'inherit',
  },
}));

const Footer: FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const handleClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Container
      component="footer"
      bgcolor={{
        xs: isDarkMode ? 'inherit' : 'background.grey',
        sm: 'inherit',
      }}
      mt={{ xs: 4, sm: 0 }}
    >
      <Box
        display="flex"
        py={4}
        px={{ xs: 2, sm: 3, md: 5 }}
        flexDirection={{ xs: 'column-reverse', sm: 'row' }}
        justifyContent="space-between"
        alignItems="stretch"
      >
        <Box>
          <Box
            display="flex"
            gap={3}
            mb={3}
            alignItems="flex-start"
            flexWrap="wrap"
          >
            <Link
              variant="subtitle1"
              color="text.secondary"
              href={import.meta.env.VITE_FOOTER_LINK_PRIVACY_POLICY}
            >
              Privacy Policy
            </Link>
            <Link
              variant="subtitle1"
              color="text.secondary"
              href={import.meta.env.VITE_FOOTER_LINK_TERMS_OF_SERVICE}
            >
              Terms of Service
            </Link>
            <Link
              variant="subtitle1"
              color="text.secondary"
              href={import.meta.env.VITE_FOOTER_LINK_HUMAN_PROTOCOL}
            >
              HUMAN Protocol
            </Link>
          </Box>
          <Typography variant="subtitle1" color="text.secondary">
            © 2025 HPF. HUMAN Protocol® is a registered trademark
          </Typography>
        </Box>
        <Box
          display="flex"
          flexWrap="wrap"
          gap={4}
          mb={{ xs: 4, sm: 0 }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent={{ xs: 'space-between', sm: 'flex-start' }}
        >
          <SocialMediaIconButton
            aria-label="GitHub"
            onClick={() => handleClick(import.meta.env.VITE_FOOTER_LINK_GITHUB)}
          >
            <GitHub />
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
            <Twitter />
          </SocialMediaIconButton>

          <SocialMediaIconButton
            aria-label="Telegram"
            onClick={() =>
              handleClick(import.meta.env.VITE_FOOTER_LINK_TELEGRAM)
            }
          >
            <Telegram />
          </SocialMediaIconButton>

          <SocialMediaIconButton
            aria-label="LinkedIn"
            onClick={() =>
              handleClick(import.meta.env.VITE_FOOTER_LINK_LINKEDIN)
            }
          >
            <LinkedIn />
          </SocialMediaIconButton>
        </Box>
      </Box>
    </Container>
  );
};

export default Footer;
