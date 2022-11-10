import React, { useState, forwardRef, Suspense } from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { readKey } from "openpgp/lightweight";
import Grid from "@mui/material/Grid";
import PublicKey from "./PublicKey";
import TextField from "@mui/material/TextField";
import { saveAs } from "file-saver";
import JSzip from "jszip";
import { useContractWrite, usePrepareContractWrite } from "wagmi";
import KVStore from "../contracts/KVStore.json";
import { NFTStorage } from "nft.storage";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import { generateKey } from "../services/index";
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
const client = new NFTStorage({
  token: process.env.REACT_APP_NFT_STORAGE_API as string,
});
export default function GeneratePGP() {
  const [open, setOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [privateKey, setPrivateKey] = useState<string>("");
  const [publicKey, setPublicKey] = useState<string>("");
  const [fingerprint, setFingerprint] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [cid, setCid] = useState<string>("");
  const [error, setError] = useState<string>("");
  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setError("");
    setOpen(false);
  };
  const { config } = usePrepareContractWrite({
    addressOrName: process.env.REACT_APP_CONTRACT as string,
    contractInterface: KVStore.abi,
    functionName: "set",
    args: ["public_key", cid],
  });

  const { write } = useContractWrite({
    ...config,
    onSuccess(data) {
      setLoading(false);
      setOpen(true);
      setTimeout(() => {
        setOpen(false);
      }, 3000);
    },
    onError() {
      setLoading(false);
      setError("Error transaction");
      setTimeout(() => {
        setError("");
      }, 3000);
    },
  });
  async function generatePublicKey() {
    if (name.length === 0 || email.length === 0 || password.length === 0) {
      setError("Please fill name, email, and passphrase ");
      return;
    }
    setError("");
    setPublicKey("");
    setLoading(true);
    try {
      const { publicKey: pubkey, privateKey: privkey } = await generateKey(
        name,
        email,
        password
      );

      setPrivateKey(privkey);
      setPublicKey(pubkey);
      const fingerprint2 = await readKey({ armoredKey: pubkey });
      setFingerprint(fingerprint2.getFingerprint());

      const someData = new Blob([pubkey]);
      const cid = await client.storeBlob(someData);
      setCid(cid);
      setLoading(false)
    } catch (e) {
      if(e instanceof Error){
        setLoading(false);
        setPublicKey("");
        setError(e.message);
      }
      
    }
  }

  async function downloadKey() {
    try {
      const pubkey = new Blob([publicKey], { type: "text/plain" });
      const privkey = new Blob([privateKey], { type: "text/plain" });
      const zip = new JSzip();

      zip.file("public_key.gpg", pubkey);
      zip.file("private_key", privkey);
      const ja = await zip.generateAsync({ type: "blob" });
      saveAs(ja, `${fingerprint}.zip`);
    } catch (e) {
      if(e instanceof Error){
        setError(e.message);
      }
      
    }
  }
  async function storeKV() {
    try {
      await write?.();
    } catch (e) {
      if(e instanceof Error){
        setError(e.message);
      }
      
    }
  }

  return (
    <Suspense>
      <Stack
        spacing={2}
        direction="column"
        justifyContent="center"
        marginTop={3}
      >
        { open && <Grid
          container
          justifyContent="center"
          
        >
          <Alert onClose={handleClose} severity="success" className="alertWidth">
            Transaction success
          </Alert>
        </Grid>}

        {error.length > 0 && <Grid
          container
          justifyContent="center"
        
        >
          <Alert onClose={handleClose} severity="error" className="alertWidth">
            {error}
          </Alert>
        </Grid>}
        <Grid container justifyContent="center">
          <TextField
            autoComplete=""
            disabled={loading}
            id="name"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            variant="outlined"
          />
        </Grid>
        <Grid container justifyContent="center">
          <TextField
            autoComplete=""
            type="email"
            disabled={loading}
            id="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            variant="outlined"
          />
        </Grid>
        <Grid container justifyContent="center">
          <TextField
            autoComplete=""
            disabled={loading}
            id="pass"
            type="password"
            label="Passphrase"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
          />
        </Grid>
        <Grid container justifyContent="center">
          <Button
            disabled={loading}
            variant="contained"
            onClick={generatePublicKey}
          >
            Generate Public Key
          </Button>
        </Grid>
        <Grid justifyContent="center">
          <PublicKey
            refresh={false}
            display={loading || publicKey.length > 0}
            publicKey={publicKey}
          />
        </Grid>
        <Grid container justifyContent="center">
          {(loading || publicKey) && <Button
            disabled={loading}
            variant="contained"
            onClick={downloadKey}
           
          >
            Download Key
          </Button>}
        </Grid>
        <Grid container justifyContent="center">
          {(loading || publicKey) && <Button
            disabled={loading || !write}
            className="marginBottom10"
            
            variant="contained"
            onClick={storeKV}
          >
            Add Public Key to ETH-KVSTORE
          </Button>}
        </Grid>
      </Stack>
    </Suspense>
  );
}
