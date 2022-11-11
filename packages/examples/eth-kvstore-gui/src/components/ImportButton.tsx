import React, { useRef, ChangeEvent, SetStateAction, Dispatch } from "react";
import Button from "@mui/material/Button";

import { usePrepareContractWrite, useContractWrite } from "wagmi";
import KVStore from "../contracts/KVStore.json";
import Grid from "@mui/material/Grid";
import { NFTStorage } from "nft.storage";
import * as openpgp from "openpgp";

const client = new NFTStorage({
  token: process.env.REACT_APP_NFT_STORAGE_API as string,
});

export default function ImportButton({
  setOpen,
  setError,
  setLoading,
  loading
}: {
  setOpen: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  loading:boolean;
}) {
  const { config } = usePrepareContractWrite({
    addressOrName: process.env.REACT_APP_CONTRACT as string,
    contractInterface: KVStore.abi,
    functionName: "set",
    args: ["", ""],
  });
  const { writeAsync } = useContractWrite({
    ...config,
    onSuccess() {
      setOpen(true);
      setLoading(false);
      setTimeout(()=>{
        setOpen(false)
      },3000)
    },
    onError(){
      setError("Error transaction");
      setLoading(false);
    }
  });

  const handleFile = async (e: ProgressEvent<FileReader>) => {
    try {
      setLoading(true)
      setError("");
      setOpen(false)
      const pubkey = e.target!.result as string;
      const fingerprint2 = await openpgp.readKey({ armoredKey: pubkey });

      const someData = new Blob([pubkey]);
      const cid2 = await client.storeBlob(someData);

      await writeAsync?.({
        recklesslySetUnpreparedArgs: ["public_key", cid2],
      });
    
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
        setTimeout(() => {
          setError("");
        }, 3000);
      }
    }
  };

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();
    reader.addEventListener("load", handleFile);
    reader.readAsText(ev.target.files![0]);
  };

  return (
    <Grid margin={2} className="height100">
      <Button disabled={loading} variant="contained" component="label">
        Import Public Key
        <input
          type="file"
          aria-label="add files"
          hidden
          onChange={handleChange}
        />
      </Button>
    </Grid>
  );
}
