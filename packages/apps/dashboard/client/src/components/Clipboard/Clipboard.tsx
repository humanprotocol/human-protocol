import { useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CustomTooltip from '@components/CustomTooltip';

interface ClipboardProps {
  value: string;
}

const Clipboard = ({ value }: ClipboardProps) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  return (
    <Card
      elevation={2}
      sx={{
        bgcolor: 'white.main',
        px: 3,
        py: 2,
        borderRadius: 16,
      }}
    >
      <Stack
        gap={2}
        direction="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography
          variant="subtitle2"
          sx={{
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            wordBreak: 'normal',
          }}
        >
          {value}
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
              sx={{
                color: 'text.secondary',
              }}
            />
          </CustomTooltip>
        </IconButton>
      </Stack>
    </Card>
  );
};

export default Clipboard;
