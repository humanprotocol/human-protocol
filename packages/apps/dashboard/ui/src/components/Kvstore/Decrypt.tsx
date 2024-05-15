import KVStore from '@human-protocol/core/abis/KVStore.json';
import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { Close as CloseIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  Grid,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import * as openpgp from 'openpgp';
import { useState, ChangeEvent, FC } from 'react';
import { useReadContract, useAccount } from 'wagmi';

import { Alert } from '../Alert';
import { showIPFS } from 'src/services';

export const Decrypt: FC = () => {
  const { address, chain } = useAccount();
  const [key, setKey] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [privkey, setPrivkey] = useState('');
  const [decrypted, setDecrypted] = useState('');
  const [copy, setCopy] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [filename, setFilename] = useState<string>('');

  const { refetch } = useReadContract({
    address: NETWORKS[chain?.id as ChainId]?.kvstoreAddress as `0x${string}`,
    abi: KVStore,
    functionName: 'get',
    args: [address, key],
  });

  async function getValue() {
    setLoading(true);
    try {
      const { data } = await refetch();
      setValue(await showIPFS(data!.toString()));
      setLoading(false);
    } catch (e) {
      if (e instanceof Error) {
        setLoading(false);
        setError(e.message);
      }
    }
  }

  const handleFile = async (e: ProgressEvent<FileReader>) => {
    setLoading(true);
    setPrivkey('');

    try {
      const content = e.target!.result as string;
      const a = await openpgp.readKey({ armoredKey: content });
      if (!a.isPrivate()) {
        setError('Error, file is not private key');
        setLoading(false);
        setFilename('');
        return;
      }
      setPrivkey(content);
      setLoading(false);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
        setLoading(false);
        setFilename('');
      }
    }
  };

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();
    reader.addEventListener('load', handleFile);
    reader.readAsText(ev.target.files![0]);
    setFilename(ev.target.files![0].name);
  };

  async function decryptValue() {
    setLoading(true);
    try {
      const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privkey }),
        passphrase,
      });

      const message = await openpgp.readMessage({
        armoredMessage: value,
      });

      const { data: decryptedVal } = await openpgp.decrypt({
        message,
        decryptionKeys: privateKey,
      });

      setDecrypted(decryptedVal as string);
      setLoading(false);
    } catch (e) {
      if (e instanceof Error) {
        setDecrypted('');
        setError(e.message);
        setLoading(false);
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
          copied
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
                  Decrypt
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
                <Typography>
                  Decrypt using your public key and private key
                </Typography>
              </Box>

              <TextField
                sx={{ my: 1 }}
                id="outlined-basic"
                label="Key"
                variant="outlined"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                disabled={loading}
              />
              <Box>
                <Button
                  disabled={loading}
                  onClick={getValue}
                  sx={{ my: 1, mb: !value ? 5 : 2 }}
                  variant="outlined"
                >
                  Get
                </Button>
              </Box>
              {value && (
                <>
                  <Box>
                    <Typography fontWeight={500}>Value</Typography>
                  </Box>
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
                      {value}
                    </Box>
                  </Box>
                  <Box sx={{ marginBottom: { xs: 2, sm: 2, md: 2, lg: 0 } }}>
                    <Button
                      onClick={() => {
                        setCopy(true);
                        navigator.clipboard.writeText(value);
                      }}
                      size="small"
                    >
                      Copy
                    </Button>
                  </Box>
                  <Divider sx={{ my: 2 }} light />
                  <Box>
                    <Typography>Decrypt </Typography>
                  </Box>
                  <Box
                    display={`flex`}
                    flexDirection={'row'}
                    alignContent={`center`}
                  >
                    {privkey.length === 0 && (
                      <Button
                        sx={{ my: 2 }}
                        disabled={loading}
                        variant="outlined"
                        size="small"
                        component="label"
                      >
                        Upload Private Key
                        <input
                          type="file"
                          aria-label="add files"
                          hidden
                          onChange={handleChange}
                        />
                      </Button>
                    )}
                    {privkey.length > 0 && (
                      <>
                        <Typography sx={{ my: 2 }} variant={`body1`}>
                          {filename}
                        </Typography>
                        <CloseIcon
                          onClick={() => setPrivkey('')}
                          sx={{ cursor: 'pointer', my: 2.3 }}
                        />
                      </>
                    )}
                  </Box>
                  <TextField
                    sx={{ my: 1 }}
                    id="outlined-basic"
                    label="Passphrase"
                    variant="outlined"
                    value={passphrase}
                    type="password"
                    disabled={loading}
                    onChange={(e) => setPassphrase(e.target.value)}
                  />
                  <Box
                    display={`flex`}
                    width={`100%`}
                    justifyContent={`flex-end`}
                  >
                    <Button
                      disabled={loading}
                      sx={{ my: 1, mb: !decrypted ? 5 : 2 }}
                      variant="contained"
                      onClick={decryptValue}
                    >
                      Decrypt
                    </Button>
                  </Box>
                  {decrypted && (
                    <>
                      <Box>
                        <Typography fontWeight={`500`}>
                          Decrypted Value{' '}
                        </Typography>
                      </Box>
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
                        {decrypted}
                      </Box>
                      <Box
                        sx={{ marginBottom: { xs: 2, sm: 2, md: 2, lg: 0 } }}
                      >
                        <Button
                          onClick={() => {
                            setCopy(true);
                            navigator.clipboard.writeText(value);
                          }}
                          size="small"
                        >
                          Copy
                        </Button>
                      </Box>
                    </>
                  )}
                </>
              )}
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Grid>
  );
};
