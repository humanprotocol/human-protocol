import { Container } from '@mui/material';
import { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { SignIn } from './components/sign-in';
import { AccountType } from './components/account-type';
import { MobileSignIn } from './components/mobile-sign-in';

interface SignUpPageProps {
  setIsGreyBackground: (isGreyBackground: boolean) => void;
}

export function SignUpPage({ setIsGreyBackground }: SignUpPageProps) {
  const [step, setStep] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (step === 1) {
      setIsGreyBackground(true);
    } else {
      setIsGreyBackground(false);
    }
  }, [step, setIsGreyBackground]);

  return (
    <Container>
      {step === 0 && !isMobile && <SignIn setStep={setStep} />}
      {step === 1 && !isMobile && <AccountType setStep={setStep} />}
      {isMobile ? <MobileSignIn /> : null}
    </Container>
  );
}
