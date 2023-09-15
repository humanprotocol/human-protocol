import { useAppSelector } from '../state';
import AuthLayout from './AuthLayout';
import DefaultLayout from './DefaultLayout';

export default function Layout() {
  const { isAuthed } = useAppSelector((state) => state.auth);

  if (isAuthed) return <AuthLayout />;

  return <DefaultLayout />;
}
