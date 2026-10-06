export type MessageRequestPolicy = 'everyone' | 'followers' | 'nobody';
export type MessageRequestDecision = 'accepted' | 'pending' | 'blocked';

/** Resolve whether a new direct conversation is accepted or must stay in requests. */
export function decideMessageRequest(
  policy: MessageRequestPolicy,
  requesterFollowsRecipient: boolean,
): MessageRequestDecision {
  if (policy === 'nobody') return 'blocked';
  if (policy === 'followers' && !requesterFollowsRecipient) return 'pending';
  return 'accepted';
}
