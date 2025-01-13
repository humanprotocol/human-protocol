import { Container } from '@mui/material';
import { useEffect } from 'react';
import { useBackgroundColorStore } from '@/shared/hooks/use-background-store';
import { useHomePageState } from '@/shared/hooks/use-homepage-state';
import { Welcome } from './welcome';
import { ChooseSignUpAccountType } from './choose-sign-up-account-type';

export function HomeContainer() {
  const { pageView } = useHomePageState();
  const { setWhiteBackground, setGrayBackground } = useBackgroundColorStore();

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
