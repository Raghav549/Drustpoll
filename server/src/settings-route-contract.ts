import { query } from './db.js';

const clean=(v:unknown,max:number)=>String(v??'').trim().slice(0,max);

export async function getSettingsSurface(userId:string){
  const [inventory,permissions,blocked,muted,hidden,audit,requests,alerts]=await Promise.all([
    query('SELECT * FROM privacy_data_inventory WHERE user_id=$1 ORDER BY data_class',[userId]),
    query('SELECT * FROM privacy_permissions WHERE user_id=$1 ORDER BY permission',[userId]),
    query('SELECT u.id,u.username,u.display_name FROM safety_blocks b JOIN users u ON u.id=b.blocked_user_id WHERE b.user_id=$1 ORDER BY b.created_at DESC',[userId]),
    query('SELECT u.id,u.username,u.display_name FROM safety_mutes m JOIN users u ON u.id=m.muted_user_id WHERE m.user_id=$1 ORDER BY m.created_at DESC',[userId]),
    query('SELECT term,kind,created_at FROM hidden_terms WHERE user_id=$1 ORDER BY created_at DESC',[userId]),
    query('SELECT control,value,changed_at FROM privacy_control_history WHERE user_id=$1 ORDER BY changed_at DESC LIMIT 100',[userId]),
    query('SELECT id,kind,status,created_at,completed_at FROM privacy_data_requests WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20',[userId]),
    query('SELECT * FROM security_alerts WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20',[userId])
  ]);
  return {inventory:inventory.rows,permissions:permissions.rows,blocked:blocked.rows,muted:muted.rows,hidden:hidden.rows,audit:audit.rows,requests:requests.rows,alerts:alerts.rows};
}

export function cleanSettingsValue(v:unknown,max=200){return clean(v,max);}
