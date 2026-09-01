export type DataDomain = 'identity' | 'social' | 'messaging' | 'commerce' | 'analytics';

export type Permission =
  | 'read_profile'
  | 'write_profile'
  | 'read_social_graph'
  | 'write_social_graph'
  | 'send_message'
  | 'read_message'
  | 'create_order'
  | 'manage_store'
  | 'process_payment_state';

export type Boundary = {
  domain: DataDomain;
  permissions: Permission[];
  serverReadable: boolean;
  auditRequired: boolean;
};

// Architectural contract: social identity must not implicitly grant commerce
// or private-message access. Concrete authorization lives in the backend.
export const PRIVACY_BOUNDARIES: Boundary[] = [
  { domain: 'identity', permissions: ['read_profile', 'write_profile'], serverReadable: true, auditRequired: true },
  { domain: 'social', permissions: ['read_social_graph', 'write_social_graph'], serverReadable: true, auditRequired: true },
  { domain: 'messaging', permissions: ['send_message', 'read_message'], serverReadable: false, auditRequired: true },
  { domain: 'commerce', permissions: ['create_order', 'manage_store', 'process_payment_state'], serverReadable: true, auditRequired: true },
  { domain: 'analytics', permissions: [], serverReadable: true, auditRequired: true },
];
