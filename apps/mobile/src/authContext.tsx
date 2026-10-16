import { createContext, useContext } from 'react';
import type { User } from './lib/auth';

export type AuthContextValue = {
  user: User | null;
  setUser: (user: User | null) => void;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  setUser: () => undefined,
});

export const useAuth = () => useContext(AuthContext);

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
  Terms: undefined;
  Privacy: undefined;
};
