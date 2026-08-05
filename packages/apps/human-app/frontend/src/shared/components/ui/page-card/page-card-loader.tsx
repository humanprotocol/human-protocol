import { Stack } from '@mui/material';

import { Loader } from '@/shared/components/ui/loader';
import { useIsMobile } from '@/shared/hooks';

import { commonStyles } from './styles';
import { type CommonProps } from './types';

export function PageCardLoader({ cardMaxWidth = '100%' }: CommonProps) {
  const isMobile = useIsMobile();

  const sx = cardMaxWidth
    ? {
        ...commonStyles,
        maxWidth: cardMaxWidth,
      }
    : commonStyles;

  return (
    <Stack sx={sx}>
      <Loader size={isMobile ? 54 : 72} />
    </Stack>
  );
}
