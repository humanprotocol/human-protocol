import React, { useState } from "react";
import PublicKey from "./PublicKey";
import ImportButton from "./ImportButton";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import { useContractRead, useAccount } from "wagmi";
import KVStore from "../contracts/KVStore.json";
import { Result } from "ethers/lib/utils";
import Grid from "@mui/material/Grid";
import { showIPFS } from "../services/index";

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function YourPublicKey() {
  const { address } = useAccount();
  const [key, setKey] = useState<Result | string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const { refetch } = useContractRead({
    addressOrName: process.env.REACT_APP_CONTRACT as string,
    contractInterface: KVStore.abi,
    functionName: "get",
    args: [address, "public_key"],
    async onSuccess(data: Result) {
      setError("");
      try {
        setKey(await showIPFS(data.toString()));
        setLoading(false);
      } catch (e) {
        if (e instanceof Error) {
          setLoading(false);
          setError(e.message);
          setTimeout(() => {
            setError("");
          }, 3000);
        }
      }
    },
  });

  async function refreshPubkey() {
    try {
      setError("");
      setLoading(true);
      const {data}=await refetch?.();
      setKey(await showIPFS(data!.toString()));
      setLoading(false)
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
        setLoading(false);
      }
    }
  }

  return (
    <>
      {open && <Grid
        container
        justifyContent="center"
        className="marginTop2"
      >
        <Alert
          onClose={() => setOpen(!open)}
          severity="success"
          className="alertWidth"
        >
          Transaction success
        </Alert>
      </Grid>}
      {error.length > 0 && <Grid
        container
        justifyContent="center"
        className="marginTop2"
      >
        <Alert
          onClose={() => setError("")}
          severity="error"
          className="alertWidth"
        >
          {error}
        </Alert>
      </Grid>}
      <ImportButton loading={loading} setError={setError} setOpen={setOpen} setLoading={setLoading}  />
      <PublicKey
        loading={loading}
        display={true}
        refresh={true}
        refetch={refreshPubkey}
        publicKey={key as string}
      />
    </>
  );
}
