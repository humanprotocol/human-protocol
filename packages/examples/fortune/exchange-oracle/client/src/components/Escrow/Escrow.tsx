import EscrowABI from '@human-protocol/core/abis/Escrow.json';
import {
  Box,
  Button,
  Chip,
  Container,
  TextField,
  Typography,
} from '@mui/material';
import { getContract, getProvider } from '@wagmi/core';
import axios from 'axios';
import { ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { useAccount, useNetwork } from 'wagmi';
import sendFortune from '../../services/RecordingOracle/RecordingClient';

const statusesMap = [
  'Launched',
  'Pending',
  'Partial',
  'Paid',
  'Complete',
  'Cancelled',
];

function parseQuery(qs: any) {
  const result: string[] = [];
  if (qs.length === 0) {
    return {};
  }

  if (qs[0] === '?') {
    qs = qs.slice(1);
  }

  const kvs = qs.split('&');

  for (let kv of kvs) {
    const kvArr = kv.split('=');

    if (kvArr.length > 2) {
      continue;
    }

    const key = kvArr[0];
    const value = kvArr[1];

    result[key] = value;
  }

  return result;
}
export const Escrow = () => {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const provider = getProvider();
  const [escrow, setEscrow] = useState('');
  const [fortune, setFortune] = useState('');
  const [escrowStatus, setEscrowStatus] = useState('');
  const [balance, setBalance] = useState('');
  const [recordingOracleUrl, setRecordingOracleUrl] = useState('');

  const setMainEscrow = useCallback(
    async (address: string) => {
      setEscrow(address);
      const Escrow = getContract({
        address,
        abi: EscrowABI,
        signerOrProvider: provider,
      });

      const escrowSt = await Escrow.status();
      setEscrowStatus(statusesMap[escrowSt]);

      const balance = await Escrow.getBalance();
      setBalance(ethers.utils.formatEther(balance));

      const manifestUrl = await Escrow.manifestUrl();
      if (manifestUrl) {
        const manifestContent = (await axios.get(manifestUrl)).data;

        setRecordingOracleUrl(manifestContent.recordingOracleUrl);
      }
      return;
    },
    [provider]
  );

  useEffect(() => {
    const qs: any = parseQuery(window.location.search);
    const address = qs.address;
    if (ethers.utils.isAddress(address)) {
      setMainEscrow(ethers.utils.getAddress(address));
    }
  }, [setMainEscrow]);

  const send = async () => {
    await sendFortune(
      escrow,
      fortune,
      recordingOracleUrl,
      address as string,
      chain?.id as number
    );
    alert('Your fortune has been submitted');
    setFortune('');
    return;
  };

  return (
    <Container maxWidth="lg" sx={{ mx: 'auto' }}>
      <Typography color="primary" variant="h4" mb={3}>
        Fortune Job Submission
      </Typography>
      <Box
        sx={{
          background: '#fff',
          boxShadow:
            '0px 3px 1px -2px #E9EBFA, 0px 2px 2px rgba(233, 235, 250, 0.5), 0px 1px 5px rgba(233, 235, 250, 0.2)',
          borderRadius: '16px',
          py: 7,
          px: { sm: 6, md: 13 },
          mt: 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            width: '100%',
            alignItems: 'flex-start',
            gap: 3,
          }}
        >
          <TextField
            variant="outlined"
            onChange={(e) => setEscrow(e.target.value)}
            value={escrow}
            data-testid="escrowAddress"
            sx={{ flex: 1 }}
            helperText="Fill the exchange address to pass the fortune to the recording oracle"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => setMainEscrow(ethers.utils.getAddress(escrow))}
            sx={{ width: '136px', height: '56px' }}
          >
            Confirm
          </Button>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            my: 4,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography component="span" fontWeight={500}>
              Address:
            </Typography>
            {escrow && <Typography variant="caption">{escrow}</Typography>}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography component="span" fontWeight={500}>
              Status:
            </Typography>
            {escrowStatus && (
              <Chip
                sx={{
                  height: '24px',
                  '.MuiChip-label': { padding: '0px 8px' },
                }}
                label={escrowStatus}
                color="primary"
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography component="span" fontWeight={500}>
              Balance:
            </Typography>
            {balance && (
              <Typography variant="caption">{balance} HMT</Typography>
            )}
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            width: '100%',
            alignItems: 'flex-start',
            gap: 3,
          }}
        >
          <TextField
            variant="outlined"
            onChange={(e) => setFortune(e.target.value)}
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={send}
            sx={{ width: '136px', height: '56px' }}
          >
            Send Fortune
          </Button>
        </Box>
      </Box>
    </Container>
  );
};
