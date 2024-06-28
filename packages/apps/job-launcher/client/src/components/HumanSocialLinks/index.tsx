import { IconButton, Stack, StackProps } from '@mui/material';
import { FC } from 'react';

import { DiscordIcon } from '../Icons/DiscordIcon';
import { GithubIcon } from '../Icons/GithubIcon';
import { LinkedinIcon } from '../Icons/LinkedinIcon';
import { XIcon } from '../Icons/XIcon';

export const HumanSocialLinks: FC<StackProps> = (props) => (
  <Stack {...props}>
    <IconButton href="http://hmt.ai/github" target="_blank">
      <GithubIcon />
    </IconButton>
    <IconButton href="http://hmt.ai/discord" target="_blank">
      <DiscordIcon />
    </IconButton>
    <IconButton href="http://hmt.ai/twitter" target="_blank">
      <XIcon />
    </IconButton>
    <IconButton href="http://hmt.ai/linkedin" target="_blank">
      <LinkedinIcon />
    </IconButton>
  </Stack>
);
