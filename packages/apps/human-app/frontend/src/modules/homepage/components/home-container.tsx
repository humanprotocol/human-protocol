import { Container } from '@mui/material';
import { useEffect } from 'react';
import { useBackgroundContext } from '@/shared/contexts/background';
import { useHomePageState } from '@/shared/contexts/homepage-state';
import { Welcome } from './welcome';
import { ChooseSignUpAccountType } from './choose-sign-up-account-type';

export function HomeContainer() {
  const { pageView } = useHomePageState();
  const { setWhiteBackground, setGrayBackground } = useBackgroundContext();

  useEffect(() => {
    if (pageView === 'chooseSignUpAccountType') {
      setGrayBackground();
    } else {
      setWhiteBackground();
    }
  }, [setGrayBackground, setWhiteBackground, pageView]);

  return (
    <Container sx={{ position: 'relative' }}>
      {pageView === 'welcome' && <Welcome />}
      {pageView === 'chooseSignUpAccountType' && <ChooseSignUpAccountType />}
    </Container>
  );
}
