import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/core/auth/AuthProvider';

export default function RootLayout() {
  return <AuthProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown:false, animation:'slide_from_right', animationDuration:180, gestureEnabled:true, contentStyle:{backgroundColor:'#F5F6F2'} }} /></AuthProvider>;
}
