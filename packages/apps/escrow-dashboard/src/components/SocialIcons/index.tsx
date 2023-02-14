import * as React from 'react';
import { IconButton, Stack } from '@mui/material';

import GithubIcon from 'src/components/Icons/GithubIcon';
import DiscordIcon from 'src/components/Icons/DiscordIcon';
import TwitterIcon from 'src/components/Icons/TwitterIcon';
import LinkedinIcon from 'src/components/Icons/LinkedinIcon';

export const SocialIcons = ({
  direction = 'row',
}: {
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
}) => {
  return (
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
};
