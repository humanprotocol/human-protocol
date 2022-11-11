import React, { ChangeEvent, useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import { useContractRead, useAccount } from "wagmi";
import KVStore from "../contracts/KVStore.json";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import * as openpgp from "openpgp";
import Collapse from "@mui/material/Collapse";
import { showIPFS } from "../services/index";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
export default function ColorTextFields() {
  const [open, setOpen] = useState(false);

  
  const { address } = useAccount();
  const [key, setKey] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [decrypted, setDecrypted] = useState<string>("");
  const [privkey, setPrivkey] = useState<string>("");
  const [reveal, setReveal] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const { refetch } = useContractRead({
    addressOrName: process.env.REACT_APP_CONTRACT as string,
    contractInterface: KVStore.abi,
    functionName: "get",
    args: [address, key],
  });
  const handleClose = () => {
    setOpen(false);
    setError("")
  };
  async function getValue() {
    try {
      const { data } = await refetch();
      setValue(await showIPFS(data!.toString()));
      
    } catch (e) {
      if(e instanceof Error){
        setError(e.message)
      }
    }
  }
  const handleFile = (e: ProgressEvent<FileReader>) => {
    const content = e.target!.result as string;
    setPrivkey(content);
  };

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();
    reader.addEventListener("load", handleFile);
    reader.readAsText(ev.target.files![0]);
  };

  async function decryptValue() {
    try {
      const privateKey =await openpgp.decryptKey({
              privateKey: await openpgp.readPrivateKey({ armoredKey: privkey }),
              passphrase: password,
            });
 
      const message = await openpgp.readMessage({
        armoredMessage: value, // parse armored message
      });

      const { data: decryptedVal } = await openpgp.decrypt({
        message,
        decryptionKeys: privateKey,
      });

      setDecrypted(decryptedVal as string);
    } catch (e) {
      if(e instanceof Error){
        setDecrypted("");
        setOpen(true);
        setError(e.message)
        
      }
      
    }
  }
  return (
    <Box component="form" margin={2} noValidate autoComplete="off">
       {error.length > 0 && <Grid container justifyContent="center" >
          <Alert onClose={handleClose} severity="error" className="alertWidth">
            {error}
          </Alert>
        </Grid>}
      <TextField
        value={key}
        onChange={(e) => setKey(e.target.value)}
        className="marginTop1"
        fullWidth
        label="Key"
      />

      <Button className="marginTop1" variant="contained" onClick={getValue}>
        Get
      </Button>
      <Divider className="marginTop3" />
      {value && (
        <Card className="minWidth275">
          <CardContent>
            <Typography
             className="fontSize14"
              color="text.secondary"
              gutterBottom
            >
              Value
            </Typography>
            <Typography variant="h5" component="div">
              {value}
            </Typography>
          </CardContent>
        </Card>
      )}

      {value && (
        <>
          <Grid container>
            <h1>DECRYPT</h1>
          </Grid>
          <Collapse in={open}>
            <Alert
              onClose={handleClose}
              severity="error"
             className="alertWidth100"
            >
              Error decrypting
            </Alert>
          </Collapse>
          <Grid container className="marginBottom3">
            <Button className="marginTop2" variant="contained" component="label">
              Upload Private Key
              <input
                type="file"
                aria-label="add files"
                hidden
                onChange={handleChange}
              />
            </Button>
          </Grid>
          <Card className="minWidth275">
            <CardContent>
              <Typography
                className="fontSize14"
                color="text.secondary"
                gutterBottom
              >
                Private Key
              </Typography>
              <Button
                disabled={!privkey}
              className="marginTop2"
                variant="contained"
                onClick={(e) => setReveal(!reveal)}
              >
                Reveal Private Key
              </Button>
              <Typography variant="h5" component="div">
                {reveal && privkey}
              </Typography>
            </CardContent>
          </Card>
          <TextField
            disabled={!privkey}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="marginTop2"
            fullWidth
            type="password"
            label="Passphrase"
          />
          <Button
            disabled={!privkey}
            className="marginTop2"
            variant="contained"
            onClick={decryptValue}
          >
            Decrypt
          </Button>
          {decrypted && (
            <Card className="marginTop2 minWidth275">
              <CardContent>
                <Typography
                  className="fontSize14"
                  color="text.secondary"
                  gutterBottom
                >
                  Decrypted Value
                </Typography>
                <Typography variant="h5" component="div">
                  {decrypted}
                </Typography>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
}
