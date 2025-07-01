import { useState } from 'react';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';

import abbreviateAddress from '@/shared/lib/abbreviateAddress';
import CustomTooltip from '@/shared/ui/CustomTooltip';

interface AbbreviateClipboardProps {
  value: string;
  link?: string;
}
const AbbreviateClipboard = ({ value, link }: AbbreviateClipboardProps) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <Stack direction="row" gap={1}>
      <Typography
        variant="body2"
        sx={{
          whiteSpace: 'nowrap',
          textDecoration: 'inherit',
          color: 'link.main',
        }}
      >
        {link ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              navigate(link, {
                preventScrollReset: false,
              });
            }}
          >
            <Link
              href={link}
              target="_blank"
              underline="none"
              sx={{
                zIndex: 1,
                color: 'text.primary',
                '&:visited': {
                  color: 'text.primary',
                },
              }}
            >
              {abbreviateAddress(value)}
            </Link>
          </span>
        ) : (
          <>{abbreviateAddress(value)}</>
        )}
      </Typography>
      <IconButton
        onClick={() => {
          navigator.clipboard.writeText(value);
          setTooltipOpen(true);
          setTimeout(() => {
            setTooltipOpen(false);
          }, 1500);
        }}
        sx={{
          p: 0,
        }}
      >
        <CustomTooltip title="Copied!" arrow open={tooltipOpen}>
          <ContentCopyIcon
            fontSize="small"
            sx={{
              color: 'fog.main',
            }}
          />
        </CustomTooltip>
      </IconButton>
    </Stack>
  );
};

export default AbbreviateClipboard;
