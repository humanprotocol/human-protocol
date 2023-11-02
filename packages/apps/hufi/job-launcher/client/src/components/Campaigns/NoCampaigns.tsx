import { Box, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

interface NoCampaignsProps {
  message: string;
}

export const NoCampaigns: React.FC<NoCampaignsProps> = ({ message }) => {
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected && walletModalOpen) {
      setWalletModalOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '5vh', // Set minimum height to fill the viewport
        background: '#fff', // Set background color to white
        borderRadius: '20px',
      }}
    >
      <Typography variant="h6">{message}</Typography>
    </Box>
  );
};
