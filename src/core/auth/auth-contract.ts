export type AuthProvider = 'password' | 'otp' | 'oauth';

export type Session = {
  id: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  deviceId: string;
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
  | 'delete_account'
  | 'payout'
  | 'checkout_shipping_change';

export function requiresReauthentication(action: SensitiveAction): boolean {
  return true;
}
