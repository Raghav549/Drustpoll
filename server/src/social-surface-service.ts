import { query, withTransaction } from './db.js';

export type FeedbackSignal='more_like_this'|'less_like_this'|'not_interested'|'hide'|'mute'|'report';
export type FeedMode='for_you'|'following'|'latest';

function safeLimit(value:number,max=50){return Math.min(Math.max(Number.isFinite(value)?Math.trunc(value):20,1),max);}
function normalizeTopic(value:string){return value.trim().toLowerCase().slice(0,120);}

async function assertPostVisible(userId:string,postId:string){
 const r=await query<{id:string}>('SELECT p.id FROM posts p LEFT JOIN profiles pr ON pr.user_id=p.author_id WHERE p.id=$1 AND p.deleted_at IS NULL AND (p.visibility=\'public\' OR p.author_id=$2 OR (p.visibility=\'followers\' AND EXISTS(SELECT 1 FROM follows f WHERE f.follower_id=$2 AND f.followed_id=p.author_id AND f.state=\'following\'))) AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_id=$2 AND b.blocked_id=p.author_id) OR (b.blocker_id=p.author_id AND b.blocked_id=$2))',[postId,userId]);
 if(!r.rowCount)throw new Error('Post not found');
}

export async function recordRecommendationFeedback(userId:string,objectType:'post'|'reel'|'product'|'creator'|'topic',objectId:string,signal:FeedbackSignal,context='feed'){
 if(!signal)throw new Error('Feedback signal required');
 await query(`INSERT INTO recommendation_feedback(user_id,object_type,object_id,signal,context) VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id,object_type,object_id,signal,context) DO UPDATE SET created_at=now()`,[userId,objectType,objectId,signal,context.slice(0,40)]);
 await query(`INSERT INTO user_feedback_signals(user_id,object_type,object_id,signal,strength) VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id,object_type,object_id,signal) DO UPDATE SET created_at=now(),strength=EXCLUDED.strength`,[userId,objectType,objectId,signal,signal==='report'||signal==='hide'||signal==='not_interested'?1:.7]);
 return{ok:true};
}

export async function removeRecommendationFeedback(userId:string,objectType:'post'|'reel'|'product'|'creator'|'topic',objectId:string,signal:FeedbackSignal,context='feed'){
 await query('DELETE FROM recommendation_feedback WHERE user_id=$1 AND object_type=$2 AND object_id=$3 AND signal=$4 AND context=$5',[userId,objectType,objectId,signal,context.slice(0,40)]);
 await query('DELETE FROM user_feedback_signals WHERE user_id=$1 AND object_type=$2 AND object_id=$3 AND signal=$4',[userId,objectType,objectId,signal]);
 return{ok:true};
}

export async function createRepost(userId:string,postId:string,quote=''){
 await assertPostVisible(userId,postId);return withTransaction(async client=>{
  const existing=await client.query('SELECT 1 FROM post_reposts WHERE post_id=$1 AND user_id=$2',[postId,userId]);
  if(existing.rowCount){await client.query('DELETE FROM post_reposts WHERE post_id=$1 AND user_id=$2',[postId,userId]);return{reposted:false};}
  if(quote.trim().length>1000)throw new Error('Quote is too long');
  await client.query('INSERT INTO post_reposts(post_id,user_id,quote) VALUES($1,$2,$3)',[postId,userId,quote.trim()]);return{reposted:true};
 });
}

export async function getPostComments(userId:string,postId:string,limit=50,before?:string){
 await assertPostVisible(userId,postId);const size=safeLimit(limit,100);const r=await query(`SELECT c.id,c.post_id,c.author_id,c.parent_id,c.body,c.created_at,u.username,u.display_name,p.avatar_url,(SELECT count(*)::int FROM comments r WHERE r.parent_id=c.id AND r.deleted_at IS NULL) reply_count FROM comments c JOIN users u ON u.id=c.author_id LEFT JOIN profiles p ON p.user_id=u.id WHERE c.post_id=$1 AND c.deleted_at IS NULL AND ($2::timestamptz IS NULL OR c.created_at<$2::timestamptz) ORDER BY c.created_at DESC LIMIT $3`,[postId,before??null,size+1]);const rows=r.rows.slice(0,size);return{comments:rows,nextBefore:r.rows.length>size?new Date(rows[rows.length-1].created_at).toISOString():null};
}

export async function getCommentReplies(userId:string,commentId:string,limit=50,before?:string){
 const parent=await query<{post_id:string}>('SELECT post_id FROM comments WHERE id=$1 AND deleted_at IS NULL',[commentId]);if(!parent.rowCount)throw new Error('Comment not found');await assertPostVisible(userId,parent.rows[0].post_id);const size=safeLimit(limit,100);const r=await query(`SELECT c.id,c.post_id,c.author_id,c.parent_id,c.body,c.created_at,u.username,u.display_name,p.avatar_url FROM comments c JOIN users u ON u.id=c.author_id LEFT JOIN profiles p ON p.user_id=u.id WHERE c.parent_id=$1 AND c.deleted_at IS NULL AND ($2::timestamptz IS NULL OR c.created_at<$2::timestamptz) ORDER BY c.created_at ASC LIMIT $3`,[commentId,before??null,size+1]);const rows=r.rows.slice(0,size);return{comments:rows,nextBefore:r.rows.length>size?new Date(rows[rows.length-1].created_at).toISOString():null};
}

export async function votePoll(userId:string,postId:string,optionId:string){
 await assertPostVisible(userId,postId);return withTransaction(async client=>{const poll=await client.query<{multiple_choice:boolean;closes_at:Date|null}>('SELECT multiple_choice,closes_at FROM post_polls WHERE post_id=$1',[postId]);if(!poll.rowCount)throw new Error('Poll not found');if(poll.rows[0].closes_at&&poll.rows[0].closes_at<new Date())throw new Error('Poll is closed');const option=await client.query('SELECT 1 FROM post_poll_options WHERE post_id=$1 AND id=$2',[postId,optionId]);if(!option.rowCount)throw new Error('Poll option not found');if(!poll.rows[0].multiple_choice)await client.query('DELETE FROM post_poll_votes WHERE post_id=$1 AND user_id=$2',[postId,userId]);await client.query('INSERT INTO post_poll_votes(post_id,option_id,user_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[postId,optionId,userId]);return{ok:true};});
}

export async function getPoll(userId:string,postId:string){
 await assertPostVisible(userId,postId);const r=await query(`SELECT pp.question,pp.multiple_choice,pp.closes_at,COALESCE(json_agg(json_build_object('id',o.id,'label',o.label,'votes',(SELECT count(*)::int FROM post_poll_votes v WHERE v.option_id=o.id),'selected',EXISTS(SELECT 1 FROM post_poll_votes me WHERE me.option_id=o.id AND me.user_id=$2)) ORDER BY o.sort_order) FILTER(WHERE o.id IS NOT NULL),'[]'::json) options FROM post_polls pp LEFT JOIN post_poll_options o ON o.post_id=pp.post_id WHERE pp.post_id=$1 GROUP BY pp.post_id`,[postId,userId]);return r.rows[0]??null;
}

export async function listFeedTopics(userId:string){
 const r=await query(`SELECT topic,COUNT(*)::int AS count FROM (SELECT lower(regexp_replace(word,'[^[:alnum:]_]+','','g')) topic FROM posts p CROSS JOIN LATERAL regexp_split_to_table(p.caption,'\\s+') word WHERE p.deleted_at IS NULL AND p.visibility='public' AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_id=$1 AND b.blocked_id=p.author_id) OR (b.blocker_id=p.author_id AND b.blocked_id=$1))) x WHERE length(topic)>=3 GROUP BY topic ORDER BY count DESC,topic LIMIT 30`,[userId]);return r.rows;
}

export async function getFeedPreferences(userId:string){const r=await query('SELECT mode,topic,updated_at FROM feed_preferences WHERE user_id=$1',[userId]);return r.rows[0]??{mode:'for_you',topic:null,updated_at:null};}
export async function setFeedPreferences(userId:string,input:{mode?:FeedMode;topic?:string|null}){const mode=input.mode??'for_you';if(!['for_you','following','latest'].includes(mode))throw new Error('Invalid feed mode');const topic=input.topic?normalizeTopic(input.topic):null;await query(`INSERT INTO feed_preferences(user_id,mode,topic,updated_at) VALUES($1,$2,$3,now()) ON CONFLICT(user_id) DO UPDATE SET mode=EXCLUDED.mode,topic=EXCLUDED.topic,updated_at=now()`,[userId,mode,topic]);return getFeedPreferences(userId);}
export async function resetFeed(userId:string){await query('INSERT INTO feed_resets(user_id) VALUES($1)',[userId]);await query('DELETE FROM recommendation_feedback WHERE user_id=$1',[userId]);await query('DELETE FROM user_feedback_signals WHERE user_id=$1',[userId]);return{ok:true,resetAt:new Date().toISOString()};}
export async function setHiddenTopic(userId:string,topic:string,hidden=true){const t=normalizeTopic(topic);if(!t)throw new Error('Topic required');if(hidden)await query('INSERT INTO hidden_topics(user_id,topic) VALUES($1,$2) ON CONFLICT DO NOTHING',[userId,t]);else await query('DELETE FROM hidden_topics WHERE user_id=$1 AND topic=$2',[userId,t]);return{topic:t,hidden};}
export async function listHiddenTopics(userId:string){const r=await query('SELECT topic,created_at FROM hidden_topics WHERE user_id=$1 ORDER BY topic',[userId]);return{topics:r.rows};}
