import { Box, Button, CircularProgress, Grid, Typography } from '@mui/material';
import { useState } from 'react';
import * as authService from '../../services/auth';
import { useAppDispatch, useAppSelector } from '../../state';
import { signOut } from '../../state/auth/reducer';

export default function VerifyEmailForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { user, refreshToken } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await authService.resendEmailVerification(user?.email!);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
    setEmailSent(true);
    setIsLoading(false);
  };
  const handleLogOut = async () => {
    setIsLoading(true);
    try {
      if (refreshToken) {
        await authService.signOut(refreshToken);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
    dispatch(signOut());
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '368px', mx: 'auto', mt: 10, mb: 8 }}>
      <Typography variant="h4" fontWeight={600} sx={{ mb: 6 }}>
        Verify email
      </Typography>
      <Typography sx={{ mt: 6 }}>
        Hi,
        <br />
        <br />
        We sent an email to {user?.email!}, please check your inbox and verify
        your email. If you can’t find our email, please check junk junk/spam
        email folder.
      </Typography>
      <Box mt={6}></Box>
      <Grid container spacing={1} mt={5}>
        {!emailSent && (
          <>
            <Grid item xs={12} sm={6}>
              <Button
                size="large"
                variant="outlined"
                color="primary"
                fullWidth
                onClick={handleLogOut}
              >
                Log out
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                size="large"
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleResend}
              >
                Resend email
              </Button>
            </Grid>
          </>
        )}
        {emailSent && (
          <>
            <Grid item sx={{ width: '100%' }}>
              <Button
                size="large"
                variant="outlined"
                color="primary"
                fullWidth
                onClick={handleLogOut}
              >
                Log out
              </Button>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
}
