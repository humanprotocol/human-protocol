import * as React from 'react';
import Box from '@mui/material/Box';
import { Link, IconButton, Stack, Typography } from '@mui/material';

import GithubIcon from './Icons/GithubIcon';
import DiscordIcon from './Icons/DiscordIcon';
import TwitterIcon from './Icons/TwitterIcon';
// import TelegramIcon from './Icons/TelegramIcon';
import LinkedinIcon from './Icons/LinkedinIcon';

import smallLogoSvg from 'src/assets/small-logo.svg';

const Footer: React.FC = (): React.ReactElement => {
  return (
    <Box
      sx={{
        px: 12,
        pt: '12px',
        pb: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <img src={smallLogoSvg} alt="logo" />
        <Link href="https://www.humanprotocol.org/privacy-policy">
          <Typography
            color="text.secondary"
            variant="caption"
            ml={2.5}
            lineHeight={1}
          >
            Terms and conditions
          </Typography>
        </Link>
      </Box>
      <Typography color="text.secondary" variant="caption">
        © {new Date().getFullYear()} HPF. HUMAN Protocol® is a registered
        trademark
      </Typography>
      <Stack direction="row" spacing={4}>
        <IconButton href="http://hmt.ai/github" target="_blank">
          <GithubIcon />
        </IconButton>
        <IconButton href="http://hmt.ai/discord" target="_blank">
          <DiscordIcon />
        </IconButton>
        <IconButton href="http://hmt.ai/twitter" target="_blank">
          <TwitterIcon />
        </IconButton>
        <IconButton href="http://hmt.ai/linkedin" target="_blank">
          <LinkedinIcon />
        </IconButton>
      </Stack>
    </Box>
  );
};

export default Footer;
