import React, { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import { usePrepareContractWrite, useContractWrite, useContractRead, useAccount } from "wagmi";
import KVStore from "../contracts/KVStore.json";
import * as openpgp from "openpgp";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import { showIPFS } from "../services/index";
import Grid from "@mui/material/Grid";
import { NFTStorage } from "nft.storage";
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
const client = new NFTStorage({
  token: process.env.REACT_APP_NFT_STORAGE_API as string,
});
export default function KeyValue() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [pubkey, setPubkey] = useState<string>("");
  const [error, setError] = useState<string>("");
  const handleClose = () => {
    setOpen(false);
    setError("")
  };

  
  const { config } = usePrepareContractWrite({
    addressOrName: process.env.REACT_APP_CONTRACT as string,
    contractInterface: KVStore.abi,
    functionName: "set",
    args: [key, value],
  });
  const { writeAsync } = useContractWrite({
    ...config,
    onSuccess() {
      setOpen(true);
      setLoading(false);
      setError("")
      setTimeout(()=>{setOpen(false)},3000)
    },
    onError(err){
      setOpen(false);
      setLoading(false);
      setError(err.message)
    }
  });

  async function storeKeyValue() {
    setLoading(true);
    setError("")
    setOpen(false)
    if(key.trim().length===0 || value.trim().length===0 || pubkey.trim().length===0){
      setError("please fill key, value, and public key");
      setTimeout(()=>{setError("")},3000)
      setLoading(false)
      return
    }
    if(key.trim()==="public_key"){
      setError("please use other key name");
      setTimeout(()=>{setError("")},3000)
      setLoading(false)
      return
    }
    try {
      const publicKeyArmored = pubkey;
      const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
      const message=await openpgp.createMessage({ text: value });
      const encrypted = await openpgp.encrypt({
        message, 
        encryptionKeys: publicKey,
        config: {
          preferredCompressionAlgorithm: openpgp.enums.compression.zlib,
        },
      });
      const someData = new Blob([encrypted as string]);
      const cid = await client.storeBlob(someData);
      await writeAsync?.({
        recklesslySetUnpreparedArgs: [key, cid]
      });

      
    } catch (e) {
      if (e instanceof Error) {
        setOpen(false);
        setLoading(false);
        setError(e.message)
      }
      
    }
  }
  const {address} = useAccount();
  const { refetch } = useContractRead({
    addressOrName: process.env.REACT_APP_CONTRACT as string,
    contractInterface: KVStore.abi,
    functionName: "get",
    args: [address, "public_key"],
  });
  async function getPublicKey(){
    const {data}=await refetch?.();
    if(data){
      setPubkey(await showIPFS(data.toString()));
    }
  }
  return (
    <Box component="form" margin={2} noValidate autoComplete="off">
      {open && <Grid container justifyContent="center" className="marginBottom2" >
          <Alert
            onClose={handleClose}
            severity="success"
            className="alertWidth"
          >
            Transaction success
          </Alert>
        </Grid>}
          
          {error.length>0 && <Grid container justifyContent="center" className="marginBottom2">
          <Alert onClose={handleClose} severity="error" className="alertWidth">
            {error}
          </Alert>
        </Grid>}
      <TextField
        disabled={loading}
        value={key}
        onChange={(e) => setKey(e.target.value)}
        fullWidth
        label="Key"
      />
      <TextField
        disabled={loading}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="marginTop1"
        fullWidth
        label="Value"
      />
      <Button
        disabled={loading}
        className="marginTop2"
        variant="contained"
        onClick={getPublicKey}
      >
        Use my public key
      </Button>
      <FormControl fullWidth className="marginTop1">
        <TextField disabled={loading} value={pubkey} onChange={(e) => setPubkey(e.target.value)} placeholder="Public Key" multiline rows={4} maxRows={4} />
      </FormControl>
      <Button
        disabled={loading}
        className="marginTop2"
        onClick={storeKeyValue}
        variant="contained"
      >
        Store
      </Button>
    </Box>
  );
}
