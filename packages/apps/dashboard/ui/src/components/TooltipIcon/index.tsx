import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import React from 'react';

const BootstrapTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.arrow}`]: {
    color: '#320a8d',
  },
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#320a8d',
    boxShadow:
      '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    lineHeight: '140%',
    padding: '22px 28px',
  },
}));

export const TooltipIcon = ({
  title,
  position = 'bottomLeft',
}: {
  title: React.ReactNode;
  position?: 'bottomLeft' | 'topRight';
}) => {
  return (
    <BootstrapTooltip arrow title={title}>
      <Box
        sx={{
          width: { xs: '24px', md: '32px' },
          height: { xs: '24px', md: '32px' },
          borderRadius: '50%',
          border: '1px solid rgba(203, 207, 232, 0.80)',
          boxSizing: 'border-box',
          boxShadow:
            '0px 1px 5px 0px rgba(233, 235, 250, 0.20), 0px 2px 2px 0px rgba(233, 235, 250, 0.50), 0px 3px 1px -2px #E9EBFA',
          background: '#fff',
          color: '#858EC6',
          fontSize: 14,
          lineHeight: '157%',
          fontWeight: 600,
          letterSpacing: '0.1px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          position: 'absolute',
          top: position === 'topRight' ? '24px' : 'auto',
          right: position === 'topRight' ? { xs: '22px', md: '32px' } : 'auto',
          bottom: position === 'bottomLeft' ? '16px' : 'auto',
          left: position === 'bottomLeft' ? { xs: '24px', md: '30px' } : 'auto',
        }}
      >
        i
      </Box>
    </BootstrapTooltip>
  );
};
