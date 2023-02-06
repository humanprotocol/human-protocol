import {
  Grid,
  Paper,
  Typography,
  Box,
  Button
} from "@mui/material";
import DoneIcon from '@mui/icons-material/Done';
import React,{Dispatch} from "react";


export const Empower = ({refetch,setPublicKey}:{ refetch: any;
    setPublicKey: Dispatch<string>;}): React.ReactElement => {
    async function finish(){
        try{
            const {data}=await refetch();
            setPublicKey(data)
        }catch(e){
            if(e instanceof Error){

            }
        }
    }
  return (
    <Grid container>

      <Grid
        item

        container
        direction="row"
        justifyContent="center"
      >
        <Grid
          item
          xs={12}
          sm={12}
          md={12}
          container
          direction="column"
          justifyContent="center"
          alignItems="center"
        >
          <Box>

            <Paper>
              <Grid container direction="column">
                <Grid
                  item
                  container
                  direction="column"
                  alignItems="center"
                  sx={{
                    marginTop: { xs: 1, sm: 1, md: 10, lg: 10 },
                    paddingLeft: 10,
                    paddingRight: 10,
                    marginBottom: { md: 10, lg: 10 }
                  }}
                >
                    <DoneIcon/>
                  <Typography
                    sx={{ marginTop: 3 }}
                    variant="h6"
                    color="primary"
                  >
                    Success!
                  </Typography>
                  <Typography
                    sx={{ marginTop: 1 }}
                    variant="body2"
                    color="primary"
                  >
                    Your public key has been stored on the blockchain now, click on continue to encrypt or decrypt
                  </Typography>
                  <Button
                      onClick={finish}
                    variant="contained"
                    sx={{ marginTop: 2 }}
                  >
                    Continue
                  </Button>
                </Grid>

              </Grid>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Grid>
  );
};
