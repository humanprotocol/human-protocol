import { BetaDisclaimer } from '../components/Disclaimer/BetaDisclaimer';
import { useAppSelector } from '../state';
import { UserStatus } from '../state/auth/types';
import AuthLayout from './AuthLayout';
import DefaultLayout from './DefaultLayout';

export default function Layout() {
  const { isAuthed, user } = useAppSelector((state) => state.auth);

  return (
    <>
      <BetaDisclaimer />
      {isAuthed && user?.status === UserStatus.ACTIVE ? (
        <AuthLayout />
      ) : (
        <DefaultLayout />
      )}
    </>
  );
}
