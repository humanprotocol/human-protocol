import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  Link,
  NativeSelect,
  TextField,
  Typography,
} from '@mui/material';
import { FC, useState } from 'react';
import { PageWrapper } from 'src/components';
import { Container as CardContainer } from 'src/components/Cards/Container';

export const ConfigureOracle: FC = () => {
  const [isSuccess, setIsSuccess] = useState(false);

  return (
    <PageWrapper>
      <CardContainer maxWidth="md" mx="auto">
        {!isSuccess ? (
          <>
            <Typography
              variant="h4"
              color="text.primary"
              textAlign="center"
              sx={{ mb: 9 }}
            >
              Configure Your Oracle
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel variant="standard" htmlFor="oracle-type">
                    Type Of Oracle
                  </InputLabel>
                  <NativeSelect
                    defaultValue={0}
                    inputProps={{
                      name: 'oracleType',
                      id: 'oracle-type',
                    }}
                  >
                    <option value={0}>Exchange</option>
                    <option value={1}>Reputation</option>
                  </NativeSelect>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  variant="outlined"
                  fullWidth
                  placeholder="Percentage of Fees"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  fullWidth
                  placeholder="Webhook URL"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  fullWidth
                  placeholder="Oracle URL"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  fullWidth
                  placeholder="Refuse Notification URL"
                />
              </Grid>
            </Grid>
            <Box mt={4}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => setIsSuccess(true)}
              >
                Confirm
              </Button>
              <Button
                variant="text"
                fullWidth
                sx={{ mt: '12px' }}
                href="/staking"
              >
                Back
              </Button>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 10,
            }}
          >
            <Typography
              color="primary"
              variant="h6"
              fontWeight={500}
              gutterBottom
            >
              Success!
            </Typography>
            <Typography
              color="primary"
              variant="body2"
              textAlign="center"
              mt={2}
            >
              Congratulations, you have successfully configured your HUMAN
              Oracle.
            </Typography>
            <Typography color="primary" variant="body2" fontWeight={600} mt={4}>
              CTA lorem ipsum{' '}
              <Link href="#" target="_blank">
                here
              </Link>
            </Typography>
          </Box>
        )}
      </CardContainer>
    </PageWrapper>
  );
};
