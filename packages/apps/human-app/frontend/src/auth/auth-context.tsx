import * as React from 'react';
import { fakeAuthProvider } from '@/auth/auth';

interface UserType {
  name: string;
  email: string;
}

interface AuthContextType {
  user: UserType | null;
  signIn: (user: UserType, callback: VoidFunction) => void;
  signOut: (callback: VoidFunction) => void;
}

const authInitialState: AuthContextType = {
  user: null,
  signIn: () => null,
  signOut: () => null,
};

export const AuthContext =
  React.createContext<AuthContextType>(authInitialState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserType | null>(null);

  const signIn = (newUser: UserType, callback: VoidFunction) => {
    fakeAuthProvider.signin(() => {
      setUser(newUser);
      callback();
    });
  };

  const signOut = (callback: VoidFunction) => {
    fakeAuthProvider.signout(() => {
      setUser(null);
      callback();
    });
  };

  const value = { user, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
