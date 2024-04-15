import { Container } from '@mui/material';
import { useEffect, useState } from 'react';
import { SignIn } from './components/sign-in';
import { AccountType } from './components/account-type';

interface SignUpPageProps {
  setIsGreyBackground: (isGreyBackground: boolean) => void;
}

export function SignUpPage({ setIsGreyBackground }: SignUpPageProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step === 1) {
      setIsGreyBackground(true);
    } else {
      setIsGreyBackground(false);
    }
  }, [step, setIsGreyBackground]);

  return (
    <Container>
      {step === 0 && <SignIn setStep={setStep} />}
      {step === 1 && <AccountType setStep={setStep} />}
    </Container>
  );
}
