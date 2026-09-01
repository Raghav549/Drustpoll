export type SignUpRequest = {
  email?: string;
  phone?: string;
  password: string;
  username: string;
  displayName: string;
  devicePublicKey: string;
};

export type LoginRequest = {
  identifier: string;
  password: string;
  devicePublicKey: string;
};

export type OtpPurpose =
  | 'verify_email'
  | 'verify_phone'
  | 'login_step_up'
  | 'password_reset';

export type OtpChallenge = {
  id: string;
  purpose: OtpPurpose;
  destinationFingerprint: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  consumedAt?: number;
};

export type SessionGrant = {
  sessionId: string;
  userId: string;
  deviceId: string;
  issuedAt: number;
  expiresAt: number;
};

export const AUTH_ENDPOINTS = {
  signUp: '/v1/auth/signup',
  login: '/v1/auth/login',
  logout: '/v1/auth/logout',
  logoutAll: '/v1/auth/logout-all',
  refresh: '/v1/auth/refresh',
  requestOtp: '/v1/auth/otp/request',
  verifyOtp: '/v1/auth/otp/verify',
  forgotPassword: '/v1/auth/password/forgot',
  resetPassword: '/v1/auth/password/reset',
  changePassword: '/v1/auth/password/change',
  sessions: '/v1/auth/sessions',
  reauthenticate: '/v1/auth/reauthenticate',
} as const;

// The browser must never persist bearer credentials in localStorage/sessionStorage.
// Web sessions use Secure + HttpOnly + SameSite cookies; native clients use the
// platform secure credential store through the native adapter.
export const SESSION_SECURITY = {
  minimumSessionEntropyBits: 128,
  rotateAfterAuthentication: true,
  rotateAfterPrivilegeChange: true,
  revokeOnLogout: true,
  revokeAllOnAccountRecovery: true,
  requireTls: true,
} as const;

export const PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,
  allowUnicodeAndWhitespace: true,
  compositionRules: false,
  breachedPasswordCheck: true,
  hashing: 'argon2id',
} as const;

export const OTP_POLICY = {
  digits: 6,
  ttlSeconds: 300,
  maxAttemptsPerChallenge: 5,
  resendCooldownSeconds: 30,
} as const;
