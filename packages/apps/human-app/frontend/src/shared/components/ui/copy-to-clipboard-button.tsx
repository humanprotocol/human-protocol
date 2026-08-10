import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { IconButton, SxProps, Theme, Tooltip } from '@mui/material';
import { t } from 'i18next';

import { CopyIcon } from './icons';

type Props = {
  value: string;
  sx?: SxProps<Theme>;
};

export function CopyToClipboardButton({ value, sx }: Props) {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopyClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (isCopied) return;

    e.stopPropagation();
    navigator.clipboard.writeText(value ?? '');
    setIsCopied(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsCopied(false);
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return (
    <Tooltip
      title={t('components.copyToClipboard')}
      open={isCopied}
      placement="top"
    >
      <IconButton
        sx={[
          { p: 0, bgcolor: 'transparent' },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        disableRipple
        disabled={isCopied}
        onClick={handleCopyClick}
      >
        <CopyIcon />
      </IconButton>
    </Tooltip>
  );
}
