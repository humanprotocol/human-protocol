import { Container } from '@mui/material';
import { useEffect, useState } from 'react';
import { useBackgroundColorStore } from '@/hooks/use-background-store';
import { SignIn } from './components/sign-in';
import { AccountType } from './components/account-type';

export function SignUpPage() {
  const [step, setStep] = useState(0);
  const { setWhiteBackground, setGrayBackground } = useBackgroundColorStore();

  useEffect(() => {
    if (step === 1) {
      setGrayBackground();
    } else {
      setWhiteBackground();
    }
  }, [setGrayBackground, setWhiteBackground, step]);

  return (
    <Container>
      {step === 0 && <SignIn setStep={setStep} />}
      {step === 1 && <AccountType setStep={setStep} />}
    </Container>
  );
}
