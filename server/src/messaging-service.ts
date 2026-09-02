import { query, withTransaction } from './db.js';

async function assertNoBlock(actorId:string, participantIds:string[]){
  const ids=[...new Set(participantIds.filter(id=>id!==actorId))];
  if(!ids.length)return;
  const result=await query(`SELECT 1 FROM user_blocks b WHERE (b.blocker_id=$1 AND b.blocked_id=ANY($2::uuid[])) OR (b.blocked_id=$1 AND b.blocker_id=ANY($2::uuid[])) LIMIT 1`,[actorId,ids]);
  if(result.rowCount)throw new Error('Messaging blocked');
}

export async function listConversations(userId: string, limit = 30) {
  const size = Math.min(Math.max(Math.trunc(limit), 1), 50);
  const result = await query(`
    SELECT c.id,c.created_at,c.updated_at,
      COALESCE((SELECT max(m.created_at) FROM messages m WHERE m.conversation_id=c.id AND m.deleted_at IS NULL),c.created_at) AS last_message_at,
      COALESCE((SELECT count(*)::int FROM conversation_members cm2 WHERE cm2.conversation_id=c.id AND cm2.left_at IS NULL),0) AS member_count
    FROM conversations c JOIN conversation_members cm ON cm.conversation_id=c.id
    WHERE cm.user_id=$1 AND cm.left_at IS NULL
    ORDER BY last_message_at DESC,c.updated_at DESC LIMIT $2`, [userId, size]);
  return { conversations: result.rows };
}

export async function createConversation(userId: string, participantIds: string[]) {
  const members = [...new Set([userId, ...participantIds.filter(Boolean)])];
  if (members.length < 2 || members.length > 50) throw new Error('Conversation must have 2 to 50 members');
  await assertNoBlock(userId,members);
  return withTransaction(async client => {
    const users = await client.query('SELECT id FROM users WHERE id = ANY($1::uuid[])', [members]);
    if (users.rowCount !== members.length) throw new Error('User not found');
    const conversation = await client.query<{id:string;created_at:Date}>('INSERT INTO conversations DEFAULT VALUES RETURNING id,created_at');
    for (const member of members) await client.query('INSERT INTO conversation_members(conversation_id,user_id) VALUES($1,$2)', [conversation.rows[0].id, member]);
    return { id: conversation.rows[0].id, createdAt: conversation.rows[0].created_at.toISOString(), participantIds: members };
  });
}

async function assertMember(userId: string, conversationId: string) {
  const result = await query('SELECT 1 FROM conversation_members WHERE conversation_id=$1 AND user_id=$2 AND left_at IS NULL', [conversationId, userId]);
  if (!result.rowCount) throw new Error('Conversation not found');
}

async function conversationParticipants(conversationId:string,userId:string){
  const result=await query('SELECT user_id FROM conversation_members WHERE conversation_id=$1 AND user_id<>$2 AND left_at IS NULL',[conversationId,userId]);
  return result.rows.map(r=>String(r.user_id));
}

export async function listMessages(userId: string, conversationId: string, limit = 50, before?: string) {
  await assertMember(userId, conversationId);
  const size = Math.min(Math.max(Math.trunc(limit), 1), 100);
  const result = await query(`
    SELECT id,conversation_id,sender_id,ciphertext,key_version,created_at,delivered_at,read_at
    FROM messages WHERE conversation_id=$1 AND deleted_at IS NULL
      AND ($2::timestamptz IS NULL OR created_at < $2::timestamptz)
    ORDER BY created_at DESC LIMIT $3`, [conversationId, before ?? null, size + 1]);
  const items = result.rows.slice(0, size).reverse();
  return { messages: items, nextBefore: result.rows.length > size ? result.rows[size].created_at.toISOString() : null };
}

export async function sendEncryptedMessage(userId: string, conversationId: string, ciphertext: string, keyVersion = 1) {
  await assertMember(userId, conversationId);
  await assertNoBlock(userId,await conversationParticipants(conversationId,userId));
  if (!ciphertext || ciphertext.length > 100_000) throw new Error('Invalid message ciphertext');
  if (!Number.isInteger(keyVersion) || keyVersion < 1) throw new Error('Invalid key version');
  const result = await query<{id:string;created_at:Date}>(
    `INSERT INTO messages(conversation_id,sender_id,ciphertext,key_version) VALUES($1,$2,$3,$4) RETURNING id,created_at`,
    [conversationId,userId,ciphertext,keyVersion],
  );
  await query('UPDATE conversations SET updated_at=now() WHERE id=$1', [conversationId]);
  return { id: result.rows[0].id, createdAt: result.rows[0].created_at.toISOString() };
}

export async function markConversationRead(userId: string, conversationId: string) {
  await assertMember(userId, conversationId);
  const result = await query('UPDATE messages SET read_at=COALESCE(read_at,now()) WHERE conversation_id=$1 AND sender_id<>$2 AND read_at IS NULL AND deleted_at IS NULL', [conversationId, userId]);
  return { updated: result.rowCount ?? 0 };
}
