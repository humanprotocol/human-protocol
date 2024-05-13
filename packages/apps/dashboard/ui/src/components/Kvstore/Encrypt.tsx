import KVStore from '@human-protocol/core/abis/KVStore.json';
import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { Grid, Paper, Typography, Box, Button, TextField } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import * as openpgp from 'openpgp';
import { FC, useEffect, useState } from 'react';
import {
  useWaitForTransactionReceipt,
  useWriteContract,
  useAccount,
} from 'wagmi';

import { Alert } from '../Alert';
import { NFT_STORAGE_CLIENT } from './constants';

export type EncryptProps = {
  publicKey: string;
};

export const Encrypt: FC<EncryptProps> = ({ publicKey }) => {
  const { chain } = useAccount();
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copy, setCopy] = useState<boolean>(false);
  const [encrypted, setEncrypted] = useState<string>('');

  const { data: hash, writeContractAsync } = useWriteContract();

  const { isSuccess: isTransactionSuccess, error: errorTransaction } =
    useWaitForTransactionReceipt({
      hash,
    });

  useEffect(() => {
    if (errorTransaction) {
      setError(errorTransaction.message);
      setSuccess(false);
      setLoading(false);
    }
  }, [errorTransaction]);

  useEffect(() => {
    if (isTransactionSuccess) {
      setSuccess(true);
      setLoading(false);
    }
  }, [isTransactionSuccess]);

  async function storeKeyValue() {
    setLoading(true);
    setError('');
    setSuccess(false);
    setEncrypted('');
    if (key.trim().length === 0 || value.trim().length === 0) {
      setError('please fill key, value');
      setLoading(false);
      return;
    }

    try {
      const publicKeyArmored = await openpgp.readKey({ armoredKey: publicKey });
      const message = await openpgp.createMessage({ text: value });
      const encrypted1 = await openpgp.encrypt({
        message,
        encryptionKeys: publicKeyArmored,
        config: {
          preferredCompressionAlgorithm: openpgp.enums.compression.zlib,
        },
      });
      const someData = new Blob([encrypted1 as string]);
      const cid = await NFT_STORAGE_CLIENT.storeBlob(someData);
      await writeContractAsync?.(
        {
          address: NETWORKS[chain?.id as ChainId]
            ?.kvstoreAddress as `0x${string}`,
          abi: KVStore,
          chainId: chain?.id,
          functionName: 'set',
          args: [key, cid],
        },
        {
          onError: () => {
            setError('Error transaction');
            setSuccess(false);
            setLoading(false);
          },
        }
      );
      setEncrypted(encrypted1 as string);
    } catch (e) {
      if (e instanceof Error) {
        setLoading(false);
        setError(e.message);
      }
    }
  }

  return (
    <Grid
      item
      xs={12}
      sm={12}
      md={12}
      container
      direction="column"
      justifyContent="center"
      alignItems="center"
    >
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={copy}
        autoHideDuration={3000}
        onClose={() => setCopy(false)}
      >
        <Alert
          onClose={() => setCopy(false)}
          severity="info"
          sx={{ width: '100%' }}
        >
          Encrypted message copied
        </Alert>
      </Snackbar>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
      >
        <Alert
          onClose={() => setSuccess(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          Transaction success
        </Alert>
      </Snackbar>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={error.length > 0}
        autoHideDuration={3000}
        onClose={() => setError('')}
      >
        <Alert
          onClose={() => setError('')}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
      <Box sx={{ width: { xs: 1, md: '50%', lg: '50%', xl: '40%' } }}>
        <Paper>
          <Box sx={{ borderBottom: '1px solid #CBCFE6' }}>
            <Grid
              container
              direction="row"
              justifyContent={'space-between'}
              flexDirection={{ xs: 'column-reverse', md: 'row' }}
            >
              <Grid item>
                <Typography fontWeight={`500`} padding={`10px`}>
                  Encrypt
                </Typography>
              </Grid>
            </Grid>
          </Box>
          <Grid
            container
            direction="column"
            sx={{
              padding: {
                xs: '0px 80px 0px 80px',
                md: '0px 80px 0px 80px',
                lg: '0px 80px 0px 80px',
                xl: '0px 80px 0px 80px',
              },
            }}
          >
            <Grid
              item
              container
              direction="column"
              sx={{
                marginBottom: { lg: 10 },
              }}
            >
              <Box sx={{ mt: { md: 10, lg: 10, xl: 10 }, mb: 2 }}>
                <Typography>Encrypt using your stored public key</Typography>
              </Box>
              <TextField
                disabled={loading}
                sx={{ my: 2 }}
                id="outlined-basic"
                label="Key"
                variant="outlined"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
              <TextField
                disabled={loading}
                sx={{ my: 1 }}
                id="outlined-basic"
                label="Value"
                variant="outlined"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              <Box
                display={`flex`}
                width={`100%`}
                justifyContent={`flex-end`}
                marginBottom={2}
              >
                <Button
                  disabled={loading}
                  onClick={storeKeyValue}
                  sx={{ my: 1 }}
                  variant="contained"
                >
                  Store
                </Button>
              </Box>

              {encrypted.length > 0 && !loading && (
                <>
                  <Box sx={{ width: { xs: 1 } }}>
                    <Box
                      className="pubkey"
                      sx={{
                        backgroundColor: '#f6f7fe',
                        maxHeight: 200,
                        marginTop: 2,
                        overflowY: 'scroll',
                        overflowWrap: 'break-word',
                        padding: 4,
                        borderRadius: 3,
                      }}
                    >
                      {encrypted}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      marginTop: 2,
                      marginBottom: { xs: 2, sm: 2, md: 4, lg: 0 },
                    }}
                  >
                    <Button
                      onClick={() => {
                        setCopy(true);
                        navigator.clipboard.writeText(encrypted);
                      }}
                      size="small"
                    >
                      Copy
                    </Button>
                  </Box>
                </>
              )}
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Grid>
  );
};
