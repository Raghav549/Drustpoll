import { query } from './db.js';

export async function operationalHealth(){
  const started=Date.now();
  const db=await query<{ok:number}>('SELECT 1 ok');
  return {ok:db.rows[0]?.ok===1,databaseMs:Date.now()-started,now:new Date().toISOString()};
}

export async function recoverySnapshot(){
  const r=await query<{table_name:string;approx_rows:string}>(`SELECT relname table_name,n_live_tup::bigint approx_rows FROM pg_stat_user_tables WHERE schemaname='public' AND relname IN ('users','posts','orders','payment_intents','media_jobs','feed_events','security_events') ORDER BY relname`);
  return r.rows.map(x=>({table:x.table_name,approxRows:Number(x.approx_rows)}));
}
