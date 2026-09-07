import { createContext,useContext,useEffect,useMemo,useRef,useState,type PropsWithChildren } from 'react';
import { router,usePathname } from 'expo-router';
import { AuthState } from './auth-contract';
import { getAuthState,signOut as apiSignOut } from './auth-client-runtime';

type AuthContextValue=AuthState&{refresh:()=>Promise<void>;signOut:()=>Promise<void>};
const AuthContext=createContext<AuthContextValue|null>(null);
const PUBLIC_PATHS=new Set(['/auth','/verify-otp','/profile-setup','/language']);
export function AuthProvider({children}:PropsWithChildren){
 const[state,setState]=useState<AuthState>({status:'loading',session:null});const pathname=usePathname();const recoveryAttempted=useRef(false);
 const refresh=async()=>setState(await getAuthState());useEffect(()=>{void refresh();},[]);
 useEffect(()=>{if(state.status==='loading')return;const publicPath=PUBLIC_PATHS.has(pathname);if(state.status==='signed_out'&&!publicPath&&!recoveryAttempted.current){recoveryAttempted.current=true;void refresh();}else if(state.status==='signed_in'){recoveryAttempted.current=false;if(pathname==='/auth')router.replace('/');}},[state.status,pathname]);
 const value=useMemo<AuthContextValue>(()=>({...state,refresh,signOut:async()=>{await apiSignOut();recoveryAttempted.current=false;setState({status:'signed_out',session:null});}}),[state]);return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('useAuth must be used inside AuthProvider');return value;}
