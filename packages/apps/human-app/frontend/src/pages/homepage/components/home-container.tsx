import { Container } from '@mui/material';
import { useEffect } from 'react';
import { useBackgroundColorStore } from '@/hooks/use-background-store';
import type { HomePageStageType } from '@/pages/homepage/home.page';
import { Welcome } from './welcome';
import { ChooseSignUpAccountType } from './choose-sign-up-account-type';

export function HomeContainer({
  stage,
  setStage,
}: {
  stage: HomePageStageType;
  setStage: (step: HomePageStageType) => void;
}) {
  const { setWhiteBackground, setGrayBackground } = useBackgroundColorStore();

  useEffect(() => {
    if (stage === 'chooseSignUpAccountType') {
      setGrayBackground();
    } else {
      setWhiteBackground();
    }
  }, [setGrayBackground, setWhiteBackground, stage]);

  return (
    <Container sx={{ position: 'relative' }}>
      {stage === 'welcome' && <Welcome setStage={setStage} />}
      {stage === 'chooseSignUpAccountType' && (
        <ChooseSignUpAccountType setStage={setStage} />
      )}
    </Container>
  );
}
