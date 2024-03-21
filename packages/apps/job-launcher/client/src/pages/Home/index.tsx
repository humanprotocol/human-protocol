import { Box, Button, Link } from '@mui/material';
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { SignInForm } from '../../components/Auth/SignInForm';
import { SignUpForm } from '../../components/Auth/SignUpForm';
import { HomeStyledTab, HomeStyledTabs } from '../../components/Tabs';
import { useAppDispatch, useAppSelector } from '../../state';
import { fetchUserBalanceAsync } from '../../state/auth/reducer';
import { UserStatus } from '../../state/auth/types';

export default function Home() {
  const [tabValue, setTabValue] = useState(0);
  const [mode, setMode] = useState<string>();
  const { isAuthed, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  if (isAuthed) {
    if (user?.status === UserStatus.PENDING) {
      return <Navigate to="/validate" />;
    } else {
      dispatch(fetchUserBalanceAsync());
      return <Navigate to="/dashboard" />;
    }
  }

  const handleSignUp = () => {
    setTabValue(0);
    setMode('sign_in');
  };

  return (
    <Box
      sx={{
        mx: 'auto',
        maxWidth: '560px',
        minHeight: '580px',
        background: '#fff',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <HomeStyledTabs
        value={tabValue}
        onChange={(e, newValue) => {
          setTabValue(newValue);
          setMode(undefined);
        }}
        variant="fullWidth"
      >
        <HomeStyledTab value={0} label="Sign in" />
        <HomeStyledTab value={1} label="Sign up" />
      </HomeStyledTabs>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        flex={1}
        sx={{
          border: '1px solid #dbe1f6',
          borderRadius: '20px',
          borderTopLeftRadius: tabValue === 0 ? '0px' : '20px',
          borderTopRightRadius: tabValue === 1 ? '0px' : '20px',
        }}
        py={8}
      >
        {tabValue === 0 && (
          <>
            {mode === 'sign_in' ? (
              <SignInForm />
            ) : (
              <Box px={12} sx={{ textAlign: 'center', width: '100%' }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{ mb: 4 }}
                  onClick={() => setMode('sign_in')}
                >
                  Sign in with email
                </Button>
                <Link
                  href="https://humanprotocol.org/app/terms-and-conditions"
                  target="_blank"
                  sx={{ fontSize: '12px', textAlign: 'center' }}
                >
                  Terms & conditions
                </Link>
              </Box>
            )}
          </>
        )}
        {tabValue === 1 && (
          <>
            {mode === 'sign_up' ? (
              <SignUpForm
                onFinish={handleSignUp}
                setMode={setMode}
                setTabValue={setTabValue}
              />
            ) : (
              <Box px={12} sx={{ textAlign: 'center', width: '100%' }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{ mb: 4 }}
                  onClick={() => setMode('sign_up')}
                >
                  Sign up with email
                </Button>
                <Link
                  href="https://humanprotocol.org/app/terms-and-conditions"
                  target="_blank"
                  sx={{ fontSize: '12px', textAlign: 'center' }}
                >
                  Terms & conditions
                </Link>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
