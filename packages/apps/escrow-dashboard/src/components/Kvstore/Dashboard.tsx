import { Grid, Box, Tabs, Tab } from '@mui/material';
import React, { useState, useEffect, Dispatch } from 'react';
import { ViewTitle } from '../ViewTitle';

import { StoredPubkey } from './StoredPubkey';
import { Decrypt } from './Decrypt';
import { Encrypt } from './Encrypt';
import smallKeySvg from '../../assets/small_key.svg';
import { showIPFS } from '../../services/index';

export const Dashboard = ({
  publicKey,
  refetch,
  setPublicKey,
  setStep,
  setPage,
}: {
  publicKey: string;
  refetch: any;
  setPublicKey: Dispatch<string>;
  setStep: Dispatch<number>;
  setPage: Dispatch<number>;
}): React.ReactElement => {
  const [value, setValue] = React.useState(0);
  const [pubkey, setPubkey] = useState<string>('');
  useEffect(() => {
    if (publicKey.trim().length !== 0) {
      showIPFS(publicKey).then((a) => setPubkey(a));
    }
  }, [publicKey]);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  return (
    <Grid container>
      <Grid
        item
        xs={12}
        sm={12}
        md={12}
        direction="row"
        justifyContent="center"
      >
        <Box
          marginBottom="1em"
          display="flex"
          alignItems="center"
          flexWrap="wrap"
        >
          <ViewTitle title="ETH KV Store" iconUrl={smallKeySvg} />
        </Box>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 2 }}>
          {pubkey.trim().length > 0 && (
            <Tabs value={value} onChange={handleChange}>
              <Tab label="Public Key" />
              <Tab label="Encrypt" />
              <Tab label="Decrypt" />
            </Tabs>
          )}
        </Box>
        {value === 0 && (
          <StoredPubkey
            refetch={refetch}
            publicKey={pubkey}
            setStep={setStep}
            setPage={setPage}
            setPublicKey={setPublicKey}
          />
        )}
        {value === 1 && <Encrypt publicKey={pubkey} />}
        {value === 2 && <Decrypt />}
      </Grid>
    </Grid>
  );
};
