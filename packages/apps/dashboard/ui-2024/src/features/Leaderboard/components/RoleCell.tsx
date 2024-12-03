import { Box, Typography } from '@mui/material';
import { useBreakPoints } from '@utils/hooks/use-is-mobile';

import { EntityIcon } from './EntityIcon';

export const RoleCell = ({ role }: { role: string }) => {
  const {
    mobile: { isMobile },
  } = useBreakPoints();

  return (
    <Box display="flex" alignItems="center" gap="6px" height="100%">
      {!isMobile && <EntityIcon role={role} />}
      <Typography
        variant={isMobile ? 'subtitle2' : 'h6'}
        sx={{
          wordBreak: 'unset',
          width: '100%',
          whiteSpace: isMobile ? 'wrap' : 'nowrap',
        }}
      >
        {role}
      </Typography>
    </Box>
  );
};
