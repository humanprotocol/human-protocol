import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  TextField
} from "@mui/material";
import ListSubheader from "@mui/material/ListSubheader";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import React, { Dispatch, useState, ChangeEvent } from "react";
import { readKey } from "openpgp/lightweight";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import { Key } from "./index";
import { showGithubPGP } from "../../services/index";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import KeyIcon from "@mui/icons-material/Key";

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
const handleFile = async (e: ProgressEvent<FileReader>, setError: Dispatch<string>, setKey: Dispatch<Key>, setPage: Dispatch<number>, setStep: Dispatch<number>) => {
  try {
    const pubkey = e.target!.result as string;
    const a = await readKey({ armoredKey: pubkey });
    if (a.isPrivate()) {
      setError("Error, file is not public key");
      return;
    }
    setKey({ publicKey: pubkey, privateKey: "" });
    setPage(2.5);
    setStep(1);
  } catch (e) {
    if (e instanceof Error) setError("Error, file doesn't contain public key");
  }


};

const handleChange = (ev: ChangeEvent<HTMLInputElement>, setError: Dispatch<string>, setKey: Dispatch<Key>, setPage: Dispatch<number>, setStep: Dispatch<number>) => {
  const reader = new FileReader();
  reader.addEventListener("load", (e) => handleFile(e, setError, setKey, setPage, setStep));
  reader.readAsText(ev.target.files![0]);
};



function pickPublicKey(gpg: string, setKey: Dispatch<Key>, setPage: Dispatch<number>, setStep: Dispatch<number>) {
  setKey({ publicKey: gpg, privateKey: "" });
  setPage(2.5);
  setStep(1);
}

async function getGithubGPGFile(username: string, setError: Dispatch<string>, setPublicKeys: Dispatch<Array<{
    name:string;
  raw_key: string;
  key_id: string;
}>>) {
  try {
    const gpg = await showGithubPGP(username);
    const parsedGPG = JSON.parse(gpg);
    if (parsedGPG.length === 0) {
      setError("Error, user doesn't have any public key");
      return;
    }

    setPublicKeys(parsedGPG);


  } catch (e) {
    if (e instanceof Error) setError("Error, can't get github GPG file");
  }


}

export const ImportPubkey = ({
    setStep, setPage, setKey,pubkeyExist,refetch,setPublicKey
                             }: {
  setStep: Dispatch<number>;
  setPage: Dispatch<number>;
  setKey: Dispatch<Key>;
  pubkeyExist:boolean;
  refetch: any;
    setPublicKey: Dispatch<string>;
}) => {
  const [choose, setChoose] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [publicKeys, setPublicKeys] = useState<Array<{ raw_key: string; key_id: string; name:string}>>([]);
  async function goBack(){
      try{
          if(pubkeyExist){
              const {data}=await refetch();
              setPublicKey(data)
          }else{
          if (choose.trim().length !== 0) {
              setChoose("");
            } else {
              setStep(0);
              setPage(0);
          }
          }
      }catch(e){
          if(e instanceof Error){
              setError(e.message)
              
          }
      }


  }
  return (
    <Paper>
      <Snackbar anchorOrigin={{ vertical: "top", horizontal: "center" }} open={error.length > 0} autoHideDuration={6000}
                onClose={() => setError("")}>
        <Alert onClose={() => setError("")} severity="error" sx={{ width: "100%" }}>
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

          {choose === "file" && <><Typography variant="body2" color="primary">
            Add your public key file
          </Typography>
            <Grid
              container
              sx={{ my: { lg: 1, xl: 1 }, paddingRight: { xs: 1, sm: 1, md: 5, lg: 5 } }}
            >
              <Paper
                sx={{
                  backgroundColor: "#f6f7fe",
                  width: { xs: 220, md: 600, lg: 600, xl: 600 },
                  padding: 2,
                  marginTop: 2
                }}
              >
                <Grid container justifyContent="center">
                  <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                    Select or drop file
                    <input
                      type="file"
                      aria-label="add files"
                      hidden
                      onChange={e => handleChange(e, setError, setKey, setPage, setStep)}
                    />
                  </Button>
                </Grid>

              </Paper>
            </Grid></>}
          {choose === "github" && <><Typography variant="body2" color="primary">
            Add your public key file from github
          </Typography>
            <Grid
              container
              sx={{ my: { lg: 1, xl: 1 }, paddingRight: { xs: 1, sm: 1, md: 5, lg: 5 } }}
            >
              <Paper
                sx={{
                  backgroundColor: "#f6f7fe",
                  width: { xs: 220, md: 600, lg: 600, xl: 600 },
                  padding: 2,
                  marginTop: 2
                }}
              >
                <Grid container justifyContent="center">
                  {publicKeys.length > 0 && <Box sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}>
                    <List subheader={
                      <ListSubheader component="div" id="nested-list-subheader">
                        Pick your public key
                      </ListSubheader>
                    }>
                      {publicKeys.map(a => <ListItem key={a.raw_key} disablePadding>
                        <ListItemButton onClick={() => pickPublicKey(a.raw_key, setKey, setPage, setStep)}>
                          <ListItemIcon>
                            <KeyIcon />
                          </ListItemIcon>
                          <Grid justifyContent={`center`}>
                            <ListItemText primary={a?.name} />
                              <ListItemText primary={`Key ID : ${a.key_id}`} />
                     
                          </Grid>

                        </ListItemButton>
                      </ListItem>)}
                    </List>
                  </Box>}

                  {publicKeys.length === 0 && <TextField
                    sx={{ width: { lg: 200, xl: 200 } }}
                    id="outlined-basic"
                    label="Github username"
                    variant="outlined"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />}

                </Grid>
                <Grid container justifyContent="center">
                  {publicKeys.length === 0 ?
                    <Button variant="outlined" onClick={() => getGithubGPGFile(username, setError, setPublicKeys)}
                            sx={{ mx: 2, mt: 2 }}>
                      Get public key
                    </Button> : <Button variant="outlined" onClick={() => {
                      setChoose("github");
                      setPublicKeys([]);
                    }}
                                        sx={{ mx: 2, mt: 2 }}>
                      Try another username
                    </Button>}


                </Grid>

              </Paper>
            </Grid></>}
          {choose.length === 0 && <> <Typography variant="body2" color="primary">
            Import your public key
          </Typography>
            <Grid
              container
              sx={{
                width: { md: 650, lg: 650, xl: 650 },
                my: { lg: 1, xl: 1 },
                paddingRight: { xs: 1, sm: 1, md: 5, lg: 5 }
              }}
            >
              <Grid container justifyContent="center">
                <Button onClick={() => setChoose("file")} variant="contained" sx={{ mx: 2, mt: 2 }}>
                  Using file
                </Button>
              </Grid>
              <Grid container justifyContent="center">
                <Button onClick={() => setChoose("github")} variant="contained" sx={{ mx: 2, mt: 2 }}>
                  Using github
                </Button>
              </Grid>
            </Grid></>}
        </Grid>

        <Grid
          item
          container
          direction="row"
          justifyContent="flex-end"
          alignItems="flex-end"
          sx={{
            marginTop: { xs: 1, sm: 1, md: 10, lg: 10 },
            paddingRight: { xs: 1, sm: 1, md: 5, lg: 5 },
            marginBottom: { xs: 1, sm: 1, md: 7, lg: 7 }
          }}
        >
          <Button variant="outlined" sx={{ mr: 2 }} onClick={goBack}>
            Back
          </Button>

        </Grid>
      </Grid>
    </Paper>
  );
};
