import {
  Grid,
  Paper,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
} from '@mui/material';
import React, { Dispatch, useState } from 'react';
import { generateKey } from 'openpgp/lightweight';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
        props,
        ref,
        ) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
type Key = {
  publicKey: string;
  privateKey: string;
};
let regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const GeneratePubkey = ({ setStep }: { setStep: Dispatch<number> }) => {
  const [key, setKey] = useState<Key>({ publicKey: '', privateKey: '' });
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [passphrase, setPassphrase] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  async function generate() {
      if (name.length === 0 || !regex.test(email) || email.length === 0 || passphrase.length === 0) {
          if(!regex.test(email)){
              setError(true);
              setErrorMessage("Fill the email with correct format");
              return;
          }
          setError(true);
          setErrorMessage("Please fill name, email, and passphrase");
          return;
      }

      setError(false);
      setErrorMessage("");
    const generatedKey = await generateKey({
       userIDs: [{ name, email }], // you can pass multiple user IDs
      passphrase, // protects the private key
    });
    console.log(generatedKey);
  }
  return (
    <Paper>
        <Snackbar  anchorOrigin={{ vertical:"top", horizontal:"center" }} open={error} autoHideDuration={6000} onClose={()=>setError(false)}>
            <Alert onClose={()=>setError(false)} severity="error" sx={{ width: '100%' }}>
                {errorMessage}
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
          {' '}
          <Typography sx={{ marginTop: 3 }} variant="body2" color="primary">
            Fill the fields to generate public key
          </Typography>
          <Grid
            container
            sx={{
              my: { md:2,lg: 2, xl: 2 },
                paddingRight: { xs: 1, sm: 1,md: 10, lg: 12 },
            }}
          >
            <TextField
              sx={{ width: { md:200,lg: 200, xl: 200 } }}
              id="outlined-basic"
              label="Name"
              variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <TextField
                sx={{ mx: { md:2,lg: 2, xl: 2 }, width: { md:200,lg: 200, xl: 200 } }}
              id="Email"
              label="Email"
              variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
                sx={{ width: { md:200,lg: 200, xl: 200 } }}
              id="outlined-basic"
              label="Passphrase"
              variant="outlined"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
            />
          </Grid>
        </Grid>

        <Grid
          item
          container
          direction="row"
          justifyContent="flex-end"
          alignItems="flex-end"
          sx={{
            marginTop: { xs: 1, sm: 1,md:10, lg: 10 },
              paddingRight: { xs: 1, sm: 1,md:10, lg: 10 },
              marginBottom: { xs: 1, sm: 1,md:7, lg: 7 },
          }}
        >
          <Button variant="outlined" sx={{ mr: 2 }} onClick={() => setStep(0)}>
            Back
          </Button>
          <Button
            variant="contained"
            sx={{ marginRight: 2 }}
            onClick={generate}
          >
            Generate Public Key
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};
