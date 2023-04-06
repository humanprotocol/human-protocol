import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  NativeSelect,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { FC, useState } from 'react';
import { Container } from '../Cards/Container';
import { CurrencyInput } from './CurrencyInput';

type StakeProps = {};

type Mode = 'stake' | 'unstake';

export const Stake: FC<StakeProps> = () => {
  const [mode, setMode] = useState<Mode>();

  return (
    <Container>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'space-between',
          height: '100%',
        }}
      >
        <Box>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(e, newMode) => setMode(newMode)}
            fullWidth
          >
            <ToggleButton color="primary" value="stake">
              Stake HMT
            </ToggleButton>
            <ToggleButton color="primary" value="unstake">
              Unstake HMT
            </ToggleButton>
          </ToggleButtonGroup>
          <Box mt={4} mb={5}>
            <Grid container spacing={4} sx={{ mb: 5 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel variant="standard" htmlFor="network-selector">
                    Network
                  </InputLabel>
                  <NativeSelect
                    defaultValue={30}
                    inputProps={{
                      name: 'network',
                      id: 'network-selector',
                    }}
                  >
                    <option value={10}>Polygon</option>
                    <option value={20}>BSC</option>
                    <option value={30}>Avalanche</option>
                  </NativeSelect>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel variant="standard" htmlFor="role-selector">
                    Staking as:
                  </InputLabel>
                  <NativeSelect
                    defaultValue={30}
                    inputProps={{
                      name: 'role',
                      id: 'role-selector',
                    }}
                  >
                    <option value={10}>Job Launcher</option>
                    <option value={20}>Exchange Oracle</option>
                    <option value={30}>Reputation Oracle</option>
                  </NativeSelect>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
          <CurrencyInput placeholder="Enter amount to stake" />
          <Box my={3}>
            <Typography
              color="primary"
              textAlign="center"
              mb={1.5}
              variant="caption"
              component="p"
            >
              Network address: 0xa9fbD31cd4EAA938Fc90A31eFe231316444a1102
            </Typography>
            <Typography
              color="primary"
              textAlign="center"
              variant="caption"
              component="p"
            >
              Staking amount: 0.00 HMT
            </Typography>
          </Box>
        </Box>
        <Button color="primary" variant="contained" fullWidth>
          Confirm
        </Button>
      </Box>
    </Container>
  );
};
