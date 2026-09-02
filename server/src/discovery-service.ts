import { query } from './db.js';

export type DiscoveryKind = 'all' | 'people' | 'posts' | 'products';

export async function searchDiscovery(userId: string, rawQuery: string, kind: DiscoveryKind = 'all', limit = 20) {
  const q = rawQuery.trim().replace(/\s+/g, ' ');
  if (!q) return { query: '', people: [], posts: [], products: [] };
  const size = Math.min(Math.max(Math.trunc(limit), 1), 50);
  const pattern = `%${q}%`;
  const people = kind === 'posts' || kind === 'products' ? [] : (await query(`
    SELECT u.id,u.username,u.display_name,p.avatar_url,
      COALESCE((SELECT count(*)::int FROM follows f WHERE f.followed_id=u.id AND f.state='following'),0) AS follower_count,
      EXISTS(SELECT 1 FROM follows me WHERE me.follower_id=$1 AND me.followed_id=u.id AND me.state='following') AS following
    FROM users u LEFT JOIN profiles p ON p.user_id=u.id
    WHERE lower(u.username) LIKE lower($2) OR lower(COALESCE(p.display_name,'')) LIKE lower($2)
    ORDER BY CASE WHEN lower(u.username)=lower($3) THEN 0 WHEN lower(u.username) LIKE lower($3)||'%' THEN 1 ELSE 2 END,
             follower_count DESC,u.username ASC LIMIT $4`, [userId, pattern, q, size])).rows;
  const posts = kind === 'people' || kind === 'products' ? [] : (await query(`
    SELECT p.id,p.author_id,p.caption,p.created_at,u.username,u.display_name,pf.avatar_url,
      COALESCE((SELECT count(*)::int FROM post_reactions r WHERE r.post_id=p.id),0) AS like_count
    FROM posts p JOIN users u ON u.id=p.author_id LEFT JOIN profiles pf ON pf.user_id=u.id
    WHERE p.deleted_at IS NULL AND p.visibility='public' AND lower(p.caption) LIKE lower($1)
    ORDER BY p.created_at DESC LIMIT $2`, [pattern, size])).rows;
  const products = kind === 'people' || kind === 'posts' ? [] : (await query(`
    SELECT pr.id,pr.title,pr.description,pr.price_minor,pr.currency,pr.inventory,s.owner_id AS seller_id,s.name AS shop_name
    FROM products pr JOIN shops s ON s.id=pr.shop_id
    WHERE pr.status='active' AND s.status='active' AND (lower(pr.title) LIKE lower($1) OR lower(pr.description) LIKE lower($1) OR lower(s.name) LIKE lower($1))
    ORDER BY CASE WHEN lower(pr.title)=lower($2) THEN 0 WHEN lower(pr.title) LIKE lower($2)||'%' THEN 1 ELSE 2 END,
             pr.created_at DESC LIMIT $3`, [pattern, q, size])).rows;
  return { query: q, people, posts, products };
}
