import { IconButton, Stack } from '@mui/material';
import { FC } from 'react';

import { DiscordIcon, GithubIcon, LinkedinIcon, TwitterIcon } from '../Icons';

type SocialIconProps = {
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
};

export const SocialIcons: FC<SocialIconProps> = ({ direction = 'row' }) => (
  <Stack direction={direction} spacing={4}>
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
);

export default SocialIcons;
