import type { FC, PropsWithChildren } from 'react';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import type { SxProps } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import CustomTooltip from '@/shared/ui/CustomTooltip';

type Props = {
  title: string;
  tooltip?: string;
  sx?: SxProps;
};

const TitleSectionWrapper: FC<PropsWithChildren<Props>> = ({
  title,
  tooltip,
  sx,
  children,
}) => {
  return (
    <Stack
      alignItems={{ xs: 'start', md: 'center' }}
      gap={{ xs: 1, md: 0 }}
      direction={{ sm: 'column', md: 'row' }}
      sx={sx}
    >
      {tooltip ? (
        <Stack direction="row" alignItems="center" width={300} gap={1}>
          <CustomTooltip title={tooltip}>
            <HelpOutlineIcon
              fontSize="small"
              sx={{ color: 'text.secondary', cursor: 'help' }}
            />
          </CustomTooltip>
          <Typography variant="subtitle2">{title}</Typography>
        </Stack>
      ) : (
        <Typography variant="subtitle2" width={300}>
          {title}
        </Typography>
      )}
      <Box display="flex" flex={1}>
        {children}
      </Box>
    </Stack>
  );
};

export default TitleSectionWrapper;
