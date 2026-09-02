export type SafetyAction = 'block' | 'unblock' | 'mute' | 'unmute' | 'report';
export type ReportReason = 'spam' | 'harassment' | 'hate' | 'sexual' | 'violence' | 'scam' | 'privacy' | 'other';

export type SafetyTarget = { userId?: string; postId?: string; commentId?: string; messageId?: string };

export type SafetyDecision = {
  action: SafetyAction;
  target: SafetyTarget;
  actorId: string;
  createdAt: number;
};

export const REPORT_REASONS: readonly ReportReason[] = [
  'spam','harassment','hate','sexual','violence','scam','privacy','other',
];

export function assertReportReason(reason: string): asserts reason is ReportReason {
  if (!REPORT_REASONS.includes(reason as ReportReason)) throw new Error('Invalid report reason');
}

export function canInteractAfterBlock(blocked: boolean): boolean {
  return !blocked;
}
