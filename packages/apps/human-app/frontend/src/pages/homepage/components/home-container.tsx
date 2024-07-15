import { Container } from '@mui/material';
import { useEffect, useState } from 'react';
import { useBackgroundColorStore } from '@/hooks/use-background-store';
import { Welcome } from './welcome';
import { ChooseSignUpAccountType } from './choose-sign-up-account-type';

export type HomePageStageType = 'welcome' | 'chooseSignUpAccountType';

export function HomeContainer() {
  const [stage, setStage] = useState<HomePageStageType>('welcome');
  const { setWhiteBackground, setGrayBackground } = useBackgroundColorStore();

  useEffect(() => {
    if (stage === 'chooseSignUpAccountType') {
      setGrayBackground();
    } else {
      setWhiteBackground();
    }
  }, [setGrayBackground, setWhiteBackground, stage]);

  return (
    <Container>
      {stage === 'welcome' && <Welcome setStage={setStage} />}
      {stage === 'chooseSignUpAccountType' && (
        <ChooseSignUpAccountType setStage={setStage} />
      )}
    </Container>
  );
}
