import 'expo-video';

declare module 'expo-video' {
  interface VideoViewProps {
    /** Legacy compatibility prop; prefer fullscreenOptions={{ enable: true }}. */
    allowsFullscreen?: boolean;
  }
}
