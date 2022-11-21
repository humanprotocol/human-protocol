import * as React from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import { ConnectButton } from '@rainbow-me/rainbowkit'
export default function ButtonAppBar() {
  return (
    <Box className="boxFlexGrow">
      <AppBar position="static">
        <Toolbar>
          <Grid
            container
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6" component="div">
              eth-kvstore
            </Typography>
            <ConnectButton  />
          </Grid>
        </Toolbar>
      </AppBar>
    </Box>
  )
}
