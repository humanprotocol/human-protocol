import { Box, Typography } from '@mui/material';
import { useBreakPoints } from '@utils/hooks/use-is-mobile';
import { Link } from 'react-router-dom';
import { EntityIcon } from './EntityIcon';

export const RoleCell = ({
  role,
  websiteUrl,
}: {
  role: string;
  websiteUrl?: string;
}) => {
  const {
    mobile: { isMobile },
  } = useBreakPoints();

  return (
    <Box display="flex" alignItems="center" gap="6px" height="100%">
      {websiteUrl ? (
        <Link
          to={websiteUrl}
          style={{
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {!isMobile && <EntityIcon role={role} />}
          <Typography
            variant={isMobile ? 'subtitle2' : 'h6'}
            sx={{
              wordBreak: 'unset',
              whiteSpace: isMobile ? 'wrap' : 'nowrap',
            }}
          >
            {role}
          </Typography>
        </Link>
      ) : (
        <>
          {!isMobile && <EntityIcon role={role} />}
          <Typography
            variant={isMobile ? 'subtitle2' : 'h6'}
            sx={{
              wordBreak: 'unset',
              whiteSpace: isMobile ? 'wrap' : 'nowrap',
            }}
          >
            {role}
          </Typography>
        </>
      )}
    </Box>
  );
};
