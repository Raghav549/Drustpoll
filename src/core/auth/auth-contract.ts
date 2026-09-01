export type AuthMethod = 'password' | 'email_otp' | 'phone_otp' | 'passkey';

// Drustpoll owns the authentication system. No third-party identity provider is
// part of the core account model. OTP delivery and passkey hardware are factors,
// not external account providers.
export type Session = {
  id: string;
  userId: string;
  deviceId: string;
  createdAt: number;
  lastSeenAt: number;
  expiresAt: number;
  absoluteExpiresAt: number;
  revokedAt?: number;
};

export type AuthState =
  | { status: 'loading'; session: null }
  | { status: 'signed_out'; session: null }
  | { status: 'signed_in'; session: Session };

export type SensitiveAction =
  | 'change_password'
  | 'change_email'
  | 'change_phone'
  | 'change_username'
  | 'enable_passkey'
  | 'disable_passkey'
  | 'delete_account'
  | 'payout'
  | 'checkout_shipping_change';

export function requiresReauthentication(action: SensitiveAction): boolean {
  return true;
}

export type AuthEvent =
  | 'signup_started'
  | 'signup_completed'
  | 'login_succeeded'
  | 'login_failed'
  | 'otp_requested'
  | 'otp_verified'
  | 'password_changed'
  | 'session_created'
  | 'session_revoked'
  | 'all_sessions_revoked'
  | 'reauthentication_succeeded';
