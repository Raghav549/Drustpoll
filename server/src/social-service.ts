import { query, withTransaction } from './db.js';

export type FeedMode = 'for_you' | 'following';

async function canInteract(actorId:string,targetId:string){
  if(actorId===targetId)return true;
  const r=await query(`SELECT NOT EXISTS(
    SELECT 1 FROM user_blocks b WHERE (b.blocker_id=$1 AND b.blocked_id=$2) OR (b.blocker_id=$2 AND b.blocked_id=$1)
  ) AS allowed`,[actorId,targetId]);
  return Boolean(r.rows[0]?.allowed);
}

export async function getProfile(userId: string) {
  const result = await query(`
    SELECT u.id AS user_id,u.username,u.display_name,
           p.bio,p.avatar_url,p.website_url,p.profile_visibility,
           (SELECT count(*)::int FROM follows f WHERE f.followed_id=u.id AND f.state='following') AS follower_count,
           (SELECT count(*)::int FROM follows f WHERE f.follower_id=u.id AND f.state='following') AS following_count,
           (SELECT count(*)::int FROM posts x WHERE x.author_id=u.id AND x.deleted_at IS NULL) AS post_count
    FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.id=$1 LIMIT 1`, [userId]);
  return result.rows[0] ?? null;
}

export async function follow(actorId: string, targetId: string) {
  if (actorId === targetId) throw new Error('Cannot follow yourself');
  if(!await canInteract(actorId,targetId))throw new Error('Interaction blocked');
  const target = await query<{ visibility: string }>('SELECT profile_visibility AS visibility FROM profiles WHERE user_id=$1', [targetId]);
  if (!target.rows[0]) throw new Error('User not found');
  const state = target.rows[0].visibility === 'public' ? 'following' : 'requested';
  await query(`INSERT INTO follows(follower_id,followed_id,state) VALUES($1,$2,$3)
    ON CONFLICT(follower_id,followed_id) DO UPDATE SET state=EXCLUDED.state,created_at=now()`, [actorId,targetId,state]);
  return { state };
}

export async function unfollow(actorId: string, targetId: string) {
  await query('DELETE FROM follows WHERE follower_id=$1 AND followed_id=$2', [actorId,targetId]);
  return { state: 'none' as const };
}

export async function setFollowState(actorId: string, targetId: string, state: 'following'|'blocked'|'requested'|'none') {
  if (actorId === targetId) throw new Error('Invalid relationship');
  if (state !== 'none' && !await canInteract(actorId,targetId)) throw new Error('Interaction blocked');
  if (state === 'none') return unfollow(actorId,targetId);
  await query(`INSERT INTO follows(follower_id,followed_id,state) VALUES($1,$2,$3)
    ON CONFLICT(follower_id,followed_id) DO UPDATE SET state=EXCLUDED.state`, [actorId,targetId,state]);
  return { state };
}

export async function getFeed(userId: string, mode: FeedMode, limit = 30, before?: string) {
  const size = Math.min(Math.max(limit,1),50);
  const params: unknown[] = [userId,size + 1];
  let filter = `p.deleted_at IS NULL
    AND (p.visibility='public' OR p.author_id=$1 OR EXISTS (
      SELECT 1 FROM follows f WHERE f.follower_id=$1 AND f.followed_id=p.author_id AND f.state='following'
    ))
    AND NOT EXISTS (SELECT 1 FROM user_mutes m WHERE m.muter_id=$1 AND m.muted_id=p.author_id)
    AND NOT EXISTS (SELECT 1 FROM user_blocks b WHERE (b.blocker_id=$1 AND b.blocked_id=p.author_id) OR (b.blocker_id=p.author_id AND b.blocked_id=$1))`;
  if (mode === 'following') {
    filter += ` AND (p.author_id=$1 OR EXISTS (SELECT 1 FROM follows f WHERE f.follower_id=$1 AND f.followed_id=p.author_id AND f.state='following'))`;
  }
  if (before) { params.push(before); filter += ` AND p.created_at < $${params.length}`; }

  const result = await query(`
    SELECT p.id,p.author_id,p.caption,p.visibility,p.created_at,
      COALESCE((SELECT count(*)::int FROM post_reactions r WHERE r.post_id=p.id),0) AS like_count,
      COALESCE((SELECT count(*)::int FROM comments c WHERE c.post_id=p.id AND c.deleted_at IS NULL),0) AS comment_count,
      COALESCE((SELECT count(*)::int FROM post_saves s WHERE s.post_id=p.id),0) AS save_count,
      EXISTS (SELECT 1 FROM post_reactions me WHERE me.post_id=p.id AND me.user_id=$1) AS liked_by_me,
      EXISTS (SELECT 1 FROM post_saves me WHERE me.post_id=p.id AND me.user_id=$1) AS saved_by_me,
      u.username,u.display_name,pf.avatar_url,
      COALESCE(json_agg(json_build_object('id',m.id,'type',m.media_type,'storageKey',m.storage_key,'width',m.width,'height',m.height,'durationMs',m.duration_ms,'alt',m.alt_text)
        ORDER BY m.sort_order) FILTER (WHERE m.id IS NOT NULL),'[]'::json) AS media
    FROM posts p
    JOIN users u ON u.id=p.author_id
    LEFT JOIN profiles pf ON pf.user_id=u.id
    LEFT JOIN post_media m ON m.post_id=p.id
    WHERE ${filter}
    GROUP BY p.id,u.id,pf.avatar_url
    ORDER BY p.created_at DESC
    LIMIT $2`, params);
  const rows = result.rows.slice(0,size);
  return { items: rows, nextCursor: result.rows.length > size ? rows[rows.length - 1]?.created_at ?? null : null };
}

export async function createPost(authorId: string, input: { caption?: string; visibility?: 'public'|'followers'|'private'; mediaAssetIds?: string[] }) {
  const caption = (input.caption ?? '').trim();
  if (caption.length > 2200) throw new Error('Caption is too long');
  const visibility = input.visibility ?? 'public';
  const assetIds = Array.from(new Set(input.mediaAssetIds ?? [])).map(String).filter(Boolean);
  if (assetIds.length > 10) throw new Error('Too many media assets');

  return withTransaction(async client => {
    const post = await client.query<{ id:string; created_at:Date }>('INSERT INTO posts(author_id,caption,visibility) VALUES($1,$2,$3) RETURNING id,created_at',[authorId,caption,visibility]);
    if (assetIds.length) {
      const assets = await client.query<{id:string;media_type:'image'|'video';storage_key:string;width:number|null;height:number|null;duration_ms:number|null}>('SELECT id,media_type,storage_key,width,height,duration_ms FROM media_assets WHERE owner_id=$1 AND status=\'ready\' AND moderation_status=\'approved\' AND id=ANY($2::uuid[]) FOR SHARE',[authorId,assetIds]);
      if (assets.rowCount !== assetIds.length) throw new Error('One or more media assets are not ready');
      const byId = new Map(assets.rows.map(asset => [asset.id, asset]));
      for (const [index, assetId] of assetIds.entries()) {
        const asset = byId.get(assetId);
        if (!asset) throw new Error('Media asset not found');
        await client.query('INSERT INTO post_media(post_id,media_type,storage_key,width,height,duration_ms,alt_text,sort_order) VALUES($1,$2,$3,$4,$5,$6,$7,$8)', [post.rows[0].id,asset.media_type,asset.storage_key,asset.width,asset.height,asset.duration_ms,null,index]);
      }
    }
    return { id: post.rows[0].id, createdAt: post.rows[0].created_at.toISOString() };
  });
}

export async function toggleReaction(userId: string, postId: string, reaction = 'like') {
  return withTransaction(async client => {
    const post=await client.query<{author_id:string}>('SELECT author_id FROM posts WHERE id=$1 AND deleted_at IS NULL',[postId]);
    if(!post.rowCount)throw new Error('Post not found');
    if(!await canInteract(userId,post.rows[0].author_id))throw new Error('Interaction blocked');
    const current = await client.query('SELECT reaction FROM post_reactions WHERE user_id=$1 AND post_id=$2',[userId,postId]);
    if (current.rowCount) {
      await client.query('DELETE FROM post_reactions WHERE user_id=$1 AND post_id=$2',[userId,postId]);
      return { active:false, reaction:null };
    }
    await client.query('INSERT INTO post_reactions(post_id,user_id,reaction) VALUES($1,$2,$3)',[postId,userId,reaction]);
    return { active:true, reaction };
  });
}

export async function toggleSave(userId: string, postId: string) {
  const post=await query<{author_id:string}>('SELECT author_id FROM posts WHERE id=$1 AND deleted_at IS NULL',[postId]);
  if(!post.rowCount)throw new Error('Post not found');
  if(!await canInteract(userId,post.rows[0].author_id))throw new Error('Interaction blocked');
  const current = await query('SELECT 1 FROM post_saves WHERE user_id=$1 AND post_id=$2',[userId,postId]);
  if (current.rowCount) { await query('DELETE FROM post_saves WHERE user_id=$1 AND post_id=$2',[userId,postId]); return {saved:false}; }
  await query('INSERT INTO post_saves(post_id,user_id) VALUES($1,$2)',[postId,userId]);
  return {saved:true};
}

export async function addComment(userId: string, postId: string, body: string, parentId?: string) {
  const text = body.trim();
  if (!text || text.length > 2000) throw new Error('Invalid comment');
  const post=await query<{author_id:string}>('SELECT author_id FROM posts WHERE id=$1 AND deleted_at IS NULL',[postId]);
  if(!post.rowCount)throw new Error('Post not found');
  if(!await canInteract(userId,post.rows[0].author_id))throw new Error('Interaction blocked');
  const result = await query<{id:string;created_at:Date}>('INSERT INTO comments(post_id,author_id,parent_id,body) VALUES($1,$2,$3,$4) RETURNING id,created_at',[postId,userId,parentId ?? null,text]);
  return { id:result.rows[0].id, createdAt:result.rows[0].created_at.toISOString() };
}
