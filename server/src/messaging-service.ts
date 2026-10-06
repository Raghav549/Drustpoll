import { query, withTransaction } from './db.js';
import { decideMessageRequest, type MessageRequestPolicy } from './messaging-policy.js';

function boundedLimit(value: number, fallback: number, maximum: number) {
  return Math.min(Math.max(Number.isFinite(value) ? Math.trunc(value) : fallback, 1), maximum);
}

function assertEnvelope(ciphertext: string) {
  if (!ciphertext || ciphertext.length > 100_000 || !/^[A-Za-z0-9+/_=-]+$/.test(ciphertext)) {
    throw new Error('Invalid encrypted message envelope');
  }
}

async function assertNoBlock(actorId: string, participantIds: string[]) {
  const ids = [...new Set(participantIds.filter(id => id !== actorId))];
  if (!ids.length) return;
  const result = await query(
    `SELECT 1 FROM user_blocks b
     WHERE (b.blocker_id=$1 AND b.blocked_id=ANY($2::uuid[]))
        OR (b.blocked_id=$1 AND b.blocker_id=ANY($2::uuid[]))
     LIMIT 1`,
    [actorId, ids],
  );
  if (result.rowCount) throw new Error('Messaging blocked');
}

async function assertNoBlockInTransaction(client: any, actorId: string, participantIds: string[]) {
  const ids = [...new Set(participantIds.filter(id => id !== actorId))];
  if (!ids.length) return;
  const result = await client.query(
    `SELECT 1 FROM user_blocks b
     WHERE (b.blocker_id=$1 AND b.blocked_id=ANY($2::uuid[]))
        OR (b.blocked_id=$1 AND b.blocker_id=ANY($2::uuid[]))
     LIMIT 1`,
    [actorId, ids],
  );
  if (result.rowCount) throw new Error('Messaging blocked');
}

export async function upsertDeviceKeyBundle(
  userId: string,
  input: { deviceId: string; identityKey: string; signedPreKey: string; signedPreKeySignature: string; keyVersion: number },
) {
  const deviceId = input.deviceId.trim().slice(0, 128);
  if (!deviceId || !input.identityKey || !input.signedPreKey || !input.signedPreKeySignature) {
    throw new Error('Invalid device key bundle');
  }
  if (!Number.isInteger(input.keyVersion) || input.keyVersion < 1) throw new Error('Invalid key version');
  await query(
    `INSERT INTO device_key_bundles(user_id,device_id,identity_key,signed_pre_key,signed_pre_key_signature,key_version,rotated_at)
     VALUES($1,$2,$3,$4,$5,$6,now())
     ON CONFLICT(user_id,device_id) DO UPDATE SET
       identity_key=EXCLUDED.identity_key,
       signed_pre_key=EXCLUDED.signed_pre_key,
       signed_pre_key_signature=EXCLUDED.signed_pre_key_signature,
       key_version=EXCLUDED.key_version,
       rotated_at=now()`,
    [userId, deviceId, input.identityKey, input.signedPreKey, input.signedPreKeySignature, input.keyVersion],
  );
  return { deviceId, keyVersion: input.keyVersion };
}

export async function listDeviceKeyBundles(requesterId: string, userId: string) {
  await assertNoBlock(requesterId, [userId]);
  const result = await query(
    `SELECT device_id,identity_key,signed_pre_key,signed_pre_key_signature,key_version,created_at,rotated_at
     FROM device_key_bundles WHERE user_id=$1 ORDER BY rotated_at DESC NULLS LAST,created_at DESC`,
    [userId],
  );
  return { bundles: result.rows };
}

export async function listConversations(userId: string, limit = 30, folder: 'all' | 'unread' = 'all') {
  const size = boundedLimit(limit, 30, 50);
  const result = await query(
    `SELECT c.id,c.created_at,c.updated_at,
       COALESCE((SELECT max(m.created_at) FROM messages m WHERE m.conversation_id=c.id AND m.deleted_at IS NULL),c.created_at) last_message_at,
       COALESCE((SELECT count(*)::int FROM conversation_members cm2 WHERE cm2.conversation_id=c.id AND cm2.left_at IS NULL),0) member_count,
       COALESCE((SELECT count(*)::int FROM messages unread
                 WHERE unread.conversation_id=c.id AND unread.deleted_at IS NULL
                   AND unread.sender_id<>$1 AND unread.read_at IS NULL),0) unread_count,
       CASE WHEN mr.status='pending' AND mr.requester_id=$1 THEN 'sent'
            WHEN mr.status='accepted' THEN 'accepted' ELSE NULL END request_state
     FROM conversations c
     JOIN conversation_members cm ON cm.conversation_id=c.id AND cm.user_id=$1 AND cm.left_at IS NULL
     LEFT JOIN message_requests mr ON mr.conversation_id=c.id
     WHERE (mr.status IS DISTINCT FROM 'pending' OR mr.requester_id=$1)
       AND ($3='all' OR EXISTS(
         SELECT 1 FROM messages unread
         WHERE unread.conversation_id=c.id AND unread.deleted_at IS NULL
           AND unread.sender_id<>$1 AND unread.read_at IS NULL
       ))
     ORDER BY last_message_at DESC,c.updated_at DESC
     LIMIT $2`,
    [userId, size, folder],
  );
  return { conversations: result.rows };
}

export async function listMessageRequests(userId: string, limit = 50) {
  const size = boundedLimit(limit, 50, 100);
  const result = await query(
    `SELECT mr.id request_id,mr.conversation_id,mr.requester_id,mr.created_at,mr.updated_at,
       u.username,u.display_name,p.avatar_url,
       COALESCE((SELECT max(m.created_at) FROM messages m
                 WHERE m.conversation_id=mr.conversation_id AND m.deleted_at IS NULL),mr.created_at) last_message_at
     FROM message_requests mr
     JOIN users u ON u.id=mr.requester_id
     LEFT JOIN profiles p ON p.user_id=u.id
     WHERE mr.recipient_id=$1 AND mr.status='pending'
     ORDER BY mr.created_at DESC
     LIMIT $2`,
    [userId, size],
  );
  return { requests: result.rows };
}

export async function createConversation(userId: string, participantIds: string[]) {
  const members = [...new Set([userId, ...participantIds.map(id => String(id).trim()).filter(Boolean)])];
  if (members.length < 2 || members.length > 50) throw new Error('Conversation must have 2 to 50 members');
  const recipients = members.filter(id => id !== userId);

  return withTransaction(async client => {
    await assertNoBlockInTransaction(client, userId, recipients);
    const users = await client.query('SELECT id FROM users WHERE id=ANY($1::uuid[])', [members]);
    if (users.rowCount !== members.length) throw new Error('User not found');

    if (members.length === 2) {
      const existing = await client.query<{ id: string; created_at: Date; request_state: string | null }>(
        `SELECT c.id,c.created_at,
           CASE WHEN mr.status='pending' AND mr.requester_id=$1 THEN 'sent'
                WHEN mr.status='accepted' THEN 'accepted' ELSE NULL END request_state
         FROM conversations c
         JOIN conversation_members requester ON requester.conversation_id=c.id AND requester.user_id=$1 AND requester.left_at IS NULL
         JOIN conversation_members recipient ON recipient.conversation_id=c.id AND recipient.user_id=$2 AND recipient.left_at IS NULL
         LEFT JOIN message_requests mr ON mr.conversation_id=c.id
         WHERE (SELECT count(*) FROM conversation_members active
                WHERE active.conversation_id=c.id AND active.left_at IS NULL)=2
         ORDER BY c.created_at DESC LIMIT 1`,
        [userId, recipients[0]],
      );
      if (existing.rowCount) {
        return {
          id: existing.rows[0].id,
          createdAt: existing.rows[0].created_at.toISOString(),
          participantIds: members,
          requestState: existing.rows[0].request_state,
        };
      }

      const recipient = await client.query<{
        message_requests: MessageRequestPolicy;
        requester_follows: boolean;
      }>(
        `SELECT COALESCE(p.message_requests,'followers') message_requests,
           EXISTS(SELECT 1 FROM follows f
                  WHERE f.follower_id=$2 AND f.followed_id=u.id AND f.state='following') requester_follows
         FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=$1 FOR UPDATE OF u`,
        [recipients[0], userId],
      );
      if (!recipient.rowCount) throw new Error('User not found');
      const decision = decideMessageRequest(recipient.rows[0].message_requests, recipient.rows[0].requester_follows);
      if (decision === 'blocked') throw new Error('This person does not accept new message requests');

      const conversation = await client.query<{ id: string; created_at: Date }>(
        'INSERT INTO conversations DEFAULT VALUES RETURNING id,created_at',
      );
      const conversationId = conversation.rows[0].id;
      for (const member of members) {
        await client.query('INSERT INTO conversation_members(conversation_id,user_id) VALUES($1,$2)', [conversationId, member]);
      }
      await client.query(
        `INSERT INTO message_requests(conversation_id,requester_id,recipient_id,status,decided_at)
         VALUES($1,$2,$3,$4,CASE WHEN $4='accepted' THEN now() ELSE NULL END)`,
        [conversationId, userId, recipients[0], decision],
      );
      return {
        id: conversationId,
        createdAt: conversation.rows[0].created_at.toISOString(),
        participantIds: members,
        requestState: decision === 'pending' ? 'sent' : 'accepted',
      };
    }

    const policies = await client.query<{
      id: string;
      message_requests: MessageRequestPolicy;
      requester_follows: boolean;
    }>(
      `SELECT u.id,COALESCE(p.message_requests,'followers') message_requests,
         EXISTS(SELECT 1 FROM follows f
                WHERE f.follower_id=$1 AND f.followed_id=u.id AND f.state='following') requester_follows
       FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=ANY($2::uuid[])`,
      [userId, recipients],
    );
    if (policies.rowCount !== recipients.length) throw new Error('User not found');
    if (policies.rows.some(row => decideMessageRequest(row.message_requests, row.requester_follows) !== 'accepted')) {
      throw new Error('Every group member must accept message requests before a group can be started');
    }

    const conversation = await client.query<{ id: string; created_at: Date }>(
      'INSERT INTO conversations DEFAULT VALUES RETURNING id,created_at',
    );
    for (const member of members) {
      await client.query('INSERT INTO conversation_members(conversation_id,user_id) VALUES($1,$2)', [conversation.rows[0].id, member]);
    }
    return {
      id: conversation.rows[0].id,
      createdAt: conversation.rows[0].created_at.toISOString(),
      participantIds: members,
      requestState: 'accepted',
    };
  });
}

export async function resolveMessageRequest(userId: string, requestId: string, decision: 'accept' | 'decline') {
  return withTransaction(async client => {
    const request = await client.query<{
      id: string;
      conversation_id: string;
      status: string;
      recipient_id: string;
    }>(
      'SELECT id,conversation_id,status,recipient_id FROM message_requests WHERE id=$1 FOR UPDATE',
      [requestId],
    );
    if (!request.rowCount || request.rows[0].recipient_id !== userId) throw new Error('Message request not found');
    if (request.rows[0].status !== 'pending') throw new Error('Message request is no longer pending');
    const status = decision === 'accept' ? 'accepted' : 'declined';
    await client.query('UPDATE message_requests SET status=$2,updated_at=now(),decided_at=now() WHERE id=$1', [requestId, status]);
    if (decision === 'decline') {
      await client.query('UPDATE conversation_members SET left_at=now() WHERE conversation_id=$1 AND left_at IS NULL', [request.rows[0].conversation_id]);
    }
    return { requestId, conversationId: request.rows[0].conversation_id, status };
  });
}

async function assertMember(userId: string, conversationId: string) {
  const result = await query(
    `SELECT 1 FROM conversation_members cm
     WHERE cm.conversation_id=$1 AND cm.user_id=$2 AND cm.left_at IS NULL
       AND NOT EXISTS(SELECT 1 FROM message_requests mr
                      WHERE mr.conversation_id=cm.conversation_id
                        AND mr.status='pending' AND mr.recipient_id=$2)`,
    [conversationId, userId],
  );
  if (!result.rowCount) throw new Error('Conversation not found');
}

async function conversationParticipants(conversationId: string, userId: string) {
  const result = await query(
    'SELECT user_id FROM conversation_members WHERE conversation_id=$1 AND user_id<>$2 AND left_at IS NULL',
    [conversationId, userId],
  );
  return result.rows.map(row => String(row.user_id));
}

export async function listMessages(userId: string, conversationId: string, limit = 50, before?: string) {
  await assertMember(userId, conversationId);
  const size = boundedLimit(limit, 50, 100);
  const result = await query(
    `SELECT id,conversation_id,sender_id,ciphertext,key_version,created_at,delivered_at,read_at
     FROM messages WHERE conversation_id=$1 AND deleted_at IS NULL
       AND ($2::timestamptz IS NULL OR created_at<$2::timestamptz)
     ORDER BY created_at DESC LIMIT $3`,
    [conversationId, before ?? null, size + 1],
  );
  const items = result.rows.slice(0, size).reverse();
  return {
    messages: items,
    nextBefore: result.rows.length > size ? result.rows[size].created_at.toISOString() : null,
  };
}

export async function sendEncryptedMessage(
  userId: string,
  conversationId: string,
  ciphertext: string,
  keyVersion = 1,
  deviceId?: string,
) {
  assertEnvelope(ciphertext);
  if (!Number.isInteger(keyVersion) || keyVersion < 1) throw new Error('Invalid key version');

  return withTransaction(async client => {
    const membership = await client.query(
      `SELECT 1 FROM conversation_members cm
       WHERE cm.conversation_id=$1 AND cm.user_id=$2 AND cm.left_at IS NULL
         AND NOT EXISTS(SELECT 1 FROM message_requests mr
                        WHERE mr.conversation_id=cm.conversation_id
                          AND mr.status='pending' AND mr.recipient_id=$2)`,
      [conversationId, userId],
    );
    if (!membership.rowCount) throw new Error('Conversation not found');
    const participants = await client.query(
      'SELECT user_id FROM conversation_members WHERE conversation_id=$1 AND user_id<>$2 AND left_at IS NULL',
      [conversationId, userId],
    );
    await assertNoBlockInTransaction(client, userId, participants.rows.map(row => String(row.user_id)));

    const request = await client.query<{ status: string; requester_id: string; recipient_id: string }>(
      'SELECT status,requester_id,recipient_id FROM message_requests WHERE conversation_id=$1',
      [conversationId],
    );
    if (request.rowCount && request.rows[0].status !== 'accepted') {
      if (request.rows[0].status !== 'pending' || request.rows[0].recipient_id === userId) {
        throw new Error('This message request must be accepted before replying');
      }
      if (request.rows[0].requester_id !== userId) throw new Error('Message request not found');
    }

    if (deviceId) {
      const key = await client.query<{ key_version: number }>(
        'SELECT key_version FROM device_key_bundles WHERE user_id=$1 AND device_id=$2',
        [userId, deviceId],
      );
      if (!key.rowCount || Number(key.rows[0].key_version) !== keyVersion) throw new Error('Unknown device key version');
    }
    const saved = await client.query<{ id: string; created_at: Date }>(
      `INSERT INTO messages(conversation_id,sender_id,ciphertext,key_version)
       VALUES($1,$2,$3,$4) RETURNING id,created_at`,
      [conversationId, userId, ciphertext, keyVersion],
    );
    await client.query('UPDATE conversations SET updated_at=now() WHERE id=$1', [conversationId]);
    return { id: saved.rows[0].id, createdAt: saved.rows[0].created_at.toISOString() };
  });
}

export async function markConversationRead(userId: string, conversationId: string) {
  await assertMember(userId, conversationId);
  const result = await query(
    `UPDATE messages SET read_at=COALESCE(read_at,now())
     WHERE conversation_id=$1 AND sender_id<>$2 AND read_at IS NULL AND deleted_at IS NULL`,
    [conversationId, userId],
  );
  return { updated: result.rowCount ?? 0 };
}
