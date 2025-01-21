import { Box, Typography } from '@mui/material';
import { useBreakPoints } from '@utils/hooks/use-is-mobile';
import { Link } from 'react-router-dom';
import { EntityIcon } from './EntityIcon';

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

  return (
    <Box display="flex" alignItems="center" gap="6px" height="100%">
      <Wrapper websiteUrl={websiteUrl}>
        {!isMobile && <EntityIcon role={role} />}
        <Box>
          <Typography
            variant={isMobile ? 'subtitle2' : 'h6'}
            sx={{
              wordBreak: 'unset',
              width: '100%',
              whiteSpace: isMobile ? 'wrap' : 'nowrap',
            }}
          >
            {name}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              wordBreak: 'unset',
              width: '100%',
              whiteSpace: isMobile ? 'wrap' : 'nowrap',
            }}
          >
            {role}
          </Typography>
        </Box>
      </Wrapper>
    </Box>
  );
};
