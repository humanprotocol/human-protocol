import KVStore from '@human-protocol/core/abis/KVStore.json';
import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { Button, Grid, Paper, Snackbar, Typography } from '@mui/material';
import { saveAs } from 'file-saver';
import JSzip from 'jszip';
import { Dispatch, useState, useEffect, FC } from 'react';
import {
  useWaitForTransactionReceipt,
  useWriteContract,
  useAccount,
} from 'wagmi';

import { Alert } from '../Alert';
import { NFT_STORAGE_CLIENT } from './constants';
import { Key } from './types';

async function downloadKey(
  publicKey: string,
  privateKey: string,
  setError: Dispatch<string>
) {
  try {
    const pubkey = new Blob([publicKey], { type: 'text/plain' });
    const privkey = new Blob([privateKey], { type: 'text/plain' });
    const zip = new JSzip();

    zip.file('public_key.gpg', pubkey);
    zip.file('private_key', privkey);
    const ja = await zip.generateAsync({ type: 'blob' });
    saveAs(ja, `public_and_private_key.zip`);
  } catch (e) {
    if (e instanceof Error) {
      setError(e.message);
    }
  }
}

async function saveToNFTStorage(
  publicKey: string,
  setCid: Dispatch<string>,
  setError: Dispatch<string>
) {
  try {
    const someData = new Blob([publicKey]);
    const cid = await NFT_STORAGE_CLIENT.storeBlob(someData);
    setCid(cid);
  } catch (e) {
    if (e instanceof Error) {
      setError(e.message);
    }
  }
}

export type SuccessProps = {
  keys: Key;
  setStep: Dispatch<number>;
  setPage: Dispatch<number>;
  what: string;
};

export const Success: FC<SuccessProps> = ({ setStep, setPage, keys, what }) => {
  const { chain } = useAccount();
  const [copy, setCopy] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [cid, setCid] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  useEffect(() => {
    if (keys.publicKey.trim().length !== 0) {
      saveToNFTStorage(keys.publicKey, setCid, setError);
    }
  }, [keys.publicKey]);

  const { data: hash, writeContract } = useWriteContract();

  const {
    isLoading: loadingTransaction,
    isSuccess: isTransactionSuccess,
    error: errorTransaction,
  } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (errorTransaction) {
      setError(errorTransaction.message);
    }
  }, [errorTransaction]);

  useEffect(() => {
    if (isTransactionSuccess) {
      setSuccess(true);
      setStep(2);
      setPage(3);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTransactionSuccess]);

  function empowerHuman() {
    writeContract(
      {
        address: NETWORKS[chain?.id as ChainId]
          ?.kvstoreAddress as `0x${string}`,
        abi: KVStore,
        functionName: 'set',
        args: ['public_key', cid],
      },
      {
        onError: (error) => {
          setError(error.message);
          setSuccess(false);
        },
      }
    );
  }

  return (
    <Paper>
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
          Public key copied
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
      <Grid container direction="column">
        <Grid
          item
          container
          direction="column"
          alignItems="flex-start"
          justifyContent="center"
          sx={{ paddingLeft: 5, paddingTop: 5 }}
        >
          <Typography sx={{ marginTop: 3 }} variant="h6" color="primary">
            Success!
          </Typography>
          <Typography variant="body2" color="primary">
            Your public key has been {what}
          </Typography>
          <Grid container>
            <Paper
              className="pubkey"
              sx={{
                backgroundColor: '#f6f7fe',
                width: { lg: 600, xl: 600 },
                marginRight: { lg: 5, xl: 5 },
                height: 200,
                padding: 2,
                marginTop: 2,
                overflowY: 'scroll',
                inlineSize: { xs: 200, md: 400, lg: 600, xl: 600 },
                overflowWrap: 'break-word',
              }}
            >
              <Typography align="justify" variant="body2" color="primary">
                {keys.publicKey}
              </Typography>
            </Paper>
          </Grid>
          <Button
            size="small"
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => {
              setCopy(true);
              navigator.clipboard.writeText(keys.publicKey);
            }}
          >
            Copy
          </Button>
        </Grid>

        <Grid
          item
          container
          direction="row"
          justifyContent="flex-end"
          alignItems="flex-end"
          sx={{
            marginTop: { xs: 1, sm: 1, md: 5, lg: 5 },
            paddingRight: { xs: 1, sm: 1, md: 5, lg: 5 },
            marginBottom: { xs: 1, sm: 1, md: 7, lg: 7 },
          }}
        >
          <Button
            disabled={cid.length === 0 || loadingTransaction}
            variant="outlined"
            sx={{ mr: 2 }}
            onClick={() => {
              if (what === 'imported') {
                setStep(1);
                setPage(2);
              } else {
                setStep(1);
                setPage(1);
              }
            }}
          >
            Back
          </Button>
          {what === 'generated' && (
            <Button
              disabled={cid.length === 0 || loadingTransaction}
              variant="outlined"
              sx={{ mr: 2 }}
              onClick={() =>
                downloadKey(keys.publicKey, keys.privateKey, setError)
              }
            >
              Download
            </Button>
          )}
          <Button
            disabled={cid.length === 0 || loadingTransaction}
            onClick={() => empowerHuman()}
            variant="contained"
          >
            {cid.length === 0 ? `Please wait...` : `Add to ETH - KV Store`}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};
