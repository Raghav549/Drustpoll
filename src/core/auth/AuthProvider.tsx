import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { router, usePathname } from 'expo-router';
import { AuthState } from './auth-contract';
import { getAuthState, signOut as apiSignOut } from './auth-client';

type AuthContextValue = AuthState & { refresh: () => Promise<void>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state,setState]=useState<AuthState>({status:'loading',session:null});
  const pathname=usePathname();
  const refresh=async()=>setState(await getAuthState());
  useEffect(()=>{void refresh();},[]);
  useEffect(()=>{if(state.status==='loading')return;if(state.status==='signed_out'&&pathname!=='/auth')router.replace('/auth');if(state.status==='signed_in'&&pathname==='/auth')router.replace('/');},[state.status,pathname]);
  const value=useMemo<AuthContextValue>(()=>({ ...state, refresh, signOut:async()=>{await apiSignOut();setState({status:'signed_out',session:null});} }),[state]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('useAuth must be used inside AuthProvider');return value;}
