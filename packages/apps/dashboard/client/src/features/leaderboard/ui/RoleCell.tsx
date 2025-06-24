import { FC, PropsWithChildren } from 'react';

import { Launch as LaunchIcon } from '@mui/icons-material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';

import { useIsMobile } from '@/shared/hooks/useBreakpoints';
import convertSnakeToHumanReadable from '@/shared/lib/convertSnakeToHumanReadable';
import EntityIcon from '@/shared/ui/EntityIcon';

type WrapperProps = {
  websiteUrl?: string;
};

type Props = {
  rank: number;
  role: string;
  websiteUrl?: string;
  name?: string;
};

const Wrapper: FC<PropsWithChildren<WrapperProps>> = ({
  websiteUrl,
  children,
}) => {
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

const RoleCell: FC<Props> = ({ rank, role, websiteUrl, name }) => {
  const isMobile = useIsMobile();
  const humanReadableRole = convertSnakeToHumanReadable(role);
  const formattedName = name ? name.split(' ')[0] : null;

  return (
    <Box display="flex" alignItems="center" gap={1} height="100%">
      <Wrapper websiteUrl={websiteUrl}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body1" mr={1}>
            {rank}
          </Typography>
          <EntityIcon role={role} />
          <Box display="flex" flexDirection="column" gap={4 / 8}>
            <Box display="flex" alignItems="center" gap={12 / 8}>
              <Typography variant={isMobile ? 'subtitle2' : 'h6'}>
                {formattedName ?? humanReadableRole}
              </Typography>
              {websiteUrl ? <LaunchIcon fontSize="small" /> : null}
            </Box>
            {name && role ? (
              <Typography variant={isMobile ? 'body3' : 'subtitle2'}>
                {humanReadableRole}
              </Typography>
            ) : null}
          </Box>
        </Box>
      </Wrapper>
    </Box>
  );
};

export default RoleCell;
