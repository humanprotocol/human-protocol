import { Box, Link } from '@mui/material';
import { FC } from 'react';

import { DiscordIcon, GithubIcon, LinkedinIcon, XIcon } from '../Icons';

type SocialIconProps = {
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
};

export const SocialIcons: FC<SocialIconProps> = ({ direction = 'row' }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: direction }}>
    <Link
      href="http://hmt.ai/github"
      target="_blank"
      sx={{ m: direction === 'row' ? '0px 15px' : '15px 0px' }}
    >
      <GithubIcon />
    </Link>
    <Link
      href="http://hmt.ai/discord"
      target="_blank"
      sx={{ m: direction === 'row' ? '0px 15px' : '15px 0px' }}
    >
      <DiscordIcon />
    </Link>
    <Link
      href="http://hmt.ai/twitter"
      target="_blank"
      sx={{ m: direction === 'row' ? '0px 15px' : '15px 0px' }}
    >
      <XIcon />
    </Link>
    <Link
      href="http://hmt.ai/linkedin"
      target="_blank"
      sx={{ m: direction === 'row' ? '0px 15px' : '15px 0px' }}
    >
      <LinkedinIcon />
    </Link>
  </Box>
);
