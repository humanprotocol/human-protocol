import {
  Grid,
  Box
} from "@mui/material";
import React, { useState, useEffect, Dispatch } from "react";
import ViewTitle from "../ViewTitle";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { StoredPubkey } from "./StoredPubkey";
import { Decrypt } from "./Decrypt";
import { Encrypt } from "./Encrypt";
import { showIPFS } from "../../services/index";

export const Dashboard = ({ publicKey, refetch, setPublicKey, setStep, setPage }: {
  publicKey: string,
  refetch: any,
  setPublicKey: Dispatch<string>,
  setStep: Dispatch<number>, setPage: Dispatch<number>

}): React.ReactElement => {

  const [value, setValue] = React.useState(0);
  const [pubkey, setPubkey] = useState<string>("");
  useEffect(() => {
    showIPFS(publicKey).then(a => setPubkey(a));
  }, [publicKey]);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  return (
    <Grid container>
      <Grid
        item
        xs={12}
        sm={12}
        md={12}
        direction="row"
        justifyContent="center"
      >
        <Box marginBottom="1em" display="flex" alignItems="center" flexWrap="wrap">
          <ViewTitle title="ETH KV Store" iconUrl="/images/small_key.svg" />
        </Box>
        <Box sx={{ borderBottom: 1, borderColor: "divider", marginBottom: 2 }}>
          <Tabs value={value} onChange={handleChange}>
            <Tab label="Public Key" />
            <Tab label="Encrypt" />
            <Tab label="Decrypt" />
          </Tabs>
        </Box>
        {value === 0 && <StoredPubkey refetch={refetch} publicKey={pubkey} setStep={setStep} setPage={setPage}
                                      setPublicKey={setPublicKey} />}
        {value === 1 && <Encrypt publicKey={pubkey} />}
        {value === 2 && <Decrypt />}
      </Grid>
    </Grid>
  );
};
