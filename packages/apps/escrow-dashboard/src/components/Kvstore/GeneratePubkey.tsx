import {
  Grid,
  Paper,
  Typography,
Stack,
  Button,
  TextField,
} from '@mui/material';
import React, { Dispatch, useState } from 'react';
import { generateKey } from 'openpgp/lightweight';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import {Key} from './index'
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
        props,
        ref,
        ) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

let regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const GeneratePubkey = ({
    setStep,setPage,setKey,pubkeyExist,refetch,setPublicKey
}: {
    setStep: Dispatch<number>;
    setPage: Dispatch<number>;
    setKey: Dispatch<Key>;
    pubkeyExist: boolean;
    refetch: any;
    setPublicKey: Dispatch<string>;
}) => {

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [passphrase, setPassphrase] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [emailError, setEmailError] = useState<boolean>(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState<string>("");
  async function goBack(){
      try{
          if(pubkeyExist){
const {data}=await refetch();
setPublicKey(data)
          }else{
              setStep(0);setPage(0);
          }
      }catch(e){
          if(e instanceof Error){
setError(true)
              setErrorMessage(e.message)
          }
      }


  }
  async function generate() {
      try{
          if (name.length === 0 || email.length === 0 || passphrase.length === 0) {

              setError(true);
              setErrorMessage("Please fill name, email, and passphrase");

    return;
          }
          if(!regex.test(email)){
              setEmailError(true);
              setEmailErrorMessage("email doesn't use correct format");
              return
          }
          setEmailError(false);
          setEmailErrorMessage("");
          setError(false);
          setErrorMessage("");
          const {publicKey,privateKey} = await generateKey({
              userIDs: [{ name, email }],
              passphrase,
          });
          setKey({publicKey,privateKey})
          setPage(1.5)
          setStep(1)
      }catch(e){
          setError(true);
          if (e instanceof Error) setErrorMessage(e.message);

      }

  }
  return (
    <Paper>
        <Stack spacing={7}>
            <Snackbar   anchorOrigin={{ vertical:"top", horizontal:"center" }} open={error} autoHideDuration={6000} onClose={()=>setError(false)}>
                <Alert onClose={()=>setError(false)} severity="error" sx={{ width: '100%' }}>
                    {errorMessage}
                </Alert>
            </Snackbar>
            <Snackbar  anchorOrigin={{ vertical:"top", horizontal:"center" }} open={emailError} autoHideDuration={6000} onClose={()=>setEmailError(false)}>
                <Alert onClose={()=>setEmailError(false)} severity="error" sx={{ width: '100%' }}>
                    {emailErrorMessage}
                </Alert>
            </Snackbar>
        </Stack>

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
              sx={{ width: { md:200,lg: 200, xl: 200 },my:{xs:2} }}
              id="outlined-basic"
              label="Name"
              variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <TextField
                sx={{ mx: { md:2,lg: 2, xl: 2 }, width: { md:200,lg: 200, xl: 200 },my:{xs:2} }}
              id="Email"
              label="Email"
              variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
                sx={{ width: { md:200,lg: 200, xl: 200 },my:{xs:2} }}
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
            <Button variant="outlined" sx={{ mr: 2 }} onClick={goBack}>
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
