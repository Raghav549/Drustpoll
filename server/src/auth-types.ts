export type AuthenticatedSession = {
  sessionId: string;
  userId: string;
  deviceId: string;
  expiresAt: Date;
  absoluteExpiresAt: Date;
};

export type AuthResult = AuthenticatedSession & {
  token: string;
  refreshToken: string;
};

export type OtpPurpose =
  | 'verify_email'
  | 'verify_phone'
  | 'login_step_up'
  | 'password_reset';

export const AUTH_LIMITS = {
  signupPerIpPerHour: 8,
  loginPerIpPer15m: 20,
  otpPerIpPer15m: 5,
  passwordResetPerIpPer15m: 5,
  otpAttempts: 5,
  otpTtlMs: 5 * 60_000,
  accessSessionMs: 30 * 60_000,
  refreshSessionMs: 30 * 24 * 60 * 60_000,
  absoluteSessionMs: 180 * 24 * 60 * 60_000,
  reauthMs: 10 * 60_000,
} as const;
