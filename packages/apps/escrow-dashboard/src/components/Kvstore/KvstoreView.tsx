import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
    Box
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { ROLES } from 'src/constants';
import useLeaderboardData from 'src/hooks/useLeaderboardData';
import { shortenAddress } from 'src/utils';

export const KvstoreView = (): React.ReactElement => {

  return (
          <Grid container >

        <Grid item xs={12} sm={6} md={6} container
            direction="row"
            justifyContent="flex-start"
            alignItems="center"

          >
            <Grid item xs={12} sm={12} md={12} container
                direction="column"
                justifyContent="flex-start"
                alignItems="flex-start"

                >
                <div>
                    <Typography variant="h4" color="primary" >
                        Empower HUMAN Scan
                    </Typography>
                </div>

                <div>
                    <Typography variant="h4" color="primary" >
                        with ETH KV Store
                    </Typography>
                </div>
            </Grid>


      </Grid>
        <Grid item xs={12} sm={6} md={6}   container
            direction="row"
            justifyContent="center"

           >
            <Grid item xs={12} sm={6} md={6} container
                direction="row"
                justifyContent="center"
                alignItems="center"
                sx={{height:500}}
                >
                dsa
            </Grid>
        </Grid>
    </Grid>
  );
};
