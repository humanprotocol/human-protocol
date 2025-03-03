import { Box, Typography } from '@mui/material';
import { Launch as LaunchIcon } from '@mui/icons-material';
import { useBreakPoints } from '@utils/hooks/use-is-mobile';
import { Link } from 'react-router-dom';
import { EntityIcon } from './EntityIcon';
import { CaseConverter } from '@utils/case-converter';

const Wrapper = ({
  children,
  websiteUrl,
}: React.PropsWithChildren<{ websiteUrl?: string }>) => {
  return websiteUrl ? (
    <Link
      to={websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      {children}
    </Link>
  ) : (
    <>{children}</>
  );
};

export const RoleCell = ({
  role,
  websiteUrl,
  name,
}: {
  role: string;
  websiteUrl?: string;
  name?: string;
}) => {
  const {
    mobile: { isMobile },
  } = useBreakPoints();
  const humanReadableRole = CaseConverter.convertSnakeToHumanReadable(role);
  return (
    <Box display="flex" alignItems="center" gap={1} height="100%">
      <Wrapper websiteUrl={websiteUrl}>
        <Box display="flex" alignItems="center" gap={1}>
          {!isMobile && <EntityIcon role={role} />}
          <Box display="flex" flexDirection="column" gap={4 / 8}>
            <Box display="flex" alignItems="center" gap={12 / 8}>
              <Typography
                variant={isMobile ? 'subtitle2' : 'h6'}
                sx={{
                  wordBreak: 'unset',
                  width: '100%',
                  whiteSpace: isMobile ? 'wrap' : 'nowrap',
                }}
              >
                {name ?? humanReadableRole}
              </Typography>
              {websiteUrl ? <LaunchIcon fontSize="small" /> : null}
            </Box>
            {name && role ? (
              <Typography
                variant={isMobile ? 'body3' : 'body1'}
                sx={{
                  wordBreak: 'unset',
                  width: '100%',
                  whiteSpace: isMobile ? 'wrap' : 'nowrap',
                }}
              >
                {humanReadableRole}
              </Typography>
            ) : null}
          </Box>
        </Box>
      </Wrapper>
    </Box>
  );
};
