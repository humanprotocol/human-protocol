import {
  Grid,
  Paper,
  Typography,
  Box,
  Button
} from "@mui/material";
import React, { Dispatch, useState } from "react";
import { showIPFS } from "../../services/index";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertProps } from "@mui/material/Alert";

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export const StoredPubkey = ({ publicKey, setPublicKey, refetch, setStep, setPage }: {
  publicKey: string,
  setPublicKey: Dispatch<string>,
  refetch: any,
  setStep: Dispatch<number>,
  setPage: Dispatch<number>
}): React.ReactElement => {
  const [copy, setCopy] = useState<boolean>(false);

  async function refresh() {
    try {
      const { data } = await refetch();
      setPublicKey(await showIPFS(data));
    } catch (e) {
      if (e instanceof Error) {

      }
    }
  }

  function importNewKey() {
    setPublicKey("");
    setStep(1);
    setPage(2);
  }

  function generateNewKey() {
    setPublicKey("");
    setStep(1);
    setPage(1);
  }

  return (<Grid
    item
    xs={12}
    sm={12}
    md={12}
    container
    direction="column"
    justifyContent="center"
    alignItems="center"

  >
    <Snackbar anchorOrigin={{ vertical: "top", horizontal: "center" }} open={copy} autoHideDuration={3000}
              onClose={() => setCopy(false)}>
      <Alert onClose={() => setCopy(false)} severity="info" sx={{ width: "100%" }}>
        copied
      </Alert>
    </Snackbar>
      <Box sx={{ width: { xs: 1, md: "50%", lg: "50%", xl: "40%" } }}>

      <Paper>
        <Box sx={{ borderBottom: "1px solid #CBCFE6" }}>
          <Grid container direction="row" justifyContent={"space-between"}
                flexDirection={{ xs: "column-reverse", md: "row" }}>
            <Grid item><Typography fontWeight={`500`} padding={`10px`}>Stored Public key:</Typography></Grid>
            <Grid item><Button onClick={importNewKey} sx={{ margin: "10px" }} variant="outlined" size="small">Import New
              Key</Button>
              <Button onClick={generateNewKey} sx={{ marginRight: "10px" }} variant="contained" size="small">Generate
                New Key</Button>
            </Grid>
          </Grid>
        </Box>
        <Grid container direction="column" sx={{
          padding: {
            xs: "0px 80px 0px 80px",
            md: "0px 80px 0px 80px",
            lg: "0px 80px 0px 80px",
            xl: "0px 80px 0px 80px"
          }
        }}>
          <Grid
            item
            container
            direction="column"

            sx={{
              marginBottom: { lg: 10 }


            }}
          >
            <Box sx={{ width: { xs: 1 } }}>
              <Box
                className="pubkey"
                sx={{
                  backgroundColor: "#f6f7fe",
                  height: 200,
                  marginTop: 2,
                  overflowY: "scroll",
                  overflowWrap: "break-word",
                  padding: 4,
                  borderRadius: 3
                }}
              >
                <Typography align="justify" variant="body2" color="primary">
                  {publicKey}
                </Typography>
              </Box
              >
            </Box>
            <Box sx={{ marginTop: 2, marginBottom: { xs: 2, sm: 2, md: 2, lg: 0 } }}>
              <Button onClick={() => {
                setCopy(true);
                navigator.clipboard.writeText(publicKey);
              }} size="small">Copy</Button>
              <Button size="small" onClick={refresh}>Refresh</Button>
            </Box>

          </Grid>

        </Grid>
      </Paper>
    </Box>
  </Grid>);
};