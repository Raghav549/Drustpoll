import { query } from './db.js';

type BoolKey='reduced_motion'|'data_saver'|'large_text';
type ExperiencePrefs={appearance:string;language:string;region:string;currency:string;reduced_motion:boolean;data_saver:boolean;large_text:boolean};
const allowedAppearance=new Set(['system','light','dark']);
const clean=(v:unknown,max:number)=>String(v??'').trim().slice(0,max);

export async function getAccountExperiencePreferences(userId:string):Promise<ExperiencePrefs>{
  const r=await query<ExperiencePrefs>('SELECT appearance,language,region,currency,reduced_motion,data_saver,large_text FROM account_experience_preferences WHERE user_id=$1',[userId]);
  if(r.rows[0])return r.rows[0];
  await query('INSERT INTO account_experience_preferences(user_id) VALUES($1) ON CONFLICT DO NOTHING',[userId]);
  return {appearance:'system',language:'en',region:'IN',currency:'INR',reduced_motion:false,data_saver:false,large_text:false};
}
export async function updateAccountExperiencePreferences(userId:string,input:Record<string,unknown>):Promise<ExperiencePrefs>{
  const current=await getAccountExperiencePreferences(userId);
  const appearance=clean(input.appearance??current.appearance,20);if(!allowedAppearance.has(appearance))throw new Error('Invalid appearance');
  const language=clean(input.language??current.language,16)||'en';
  const region=clean(input.region??current.region,16)||'IN';
  const currency=clean(input.currency??current.currency,3).toUpperCase()||'INR';
  const bool=(key:BoolKey):boolean=>{const value=input[key];return value===undefined?current[key]:value===true;};
  const r=await query<ExperiencePrefs>(`INSERT INTO account_experience_preferences(user_id,appearance,language,region,currency,reduced_motion,data_saver,large_text) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(user_id) DO UPDATE SET appearance=EXCLUDED.appearance,language=EXCLUDED.language,region=EXCLUDED.region,currency=EXCLUDED.currency,reduced_motion=EXCLUDED.reduced_motion,data_saver=EXCLUDED.data_saver,large_text=EXCLUDED.large_text,updated_at=now() RETURNING appearance,language,region,currency,reduced_motion,data_saver,large_text`,[userId,appearance,language,region,currency,bool('reduced_motion'),bool('data_saver'),bool('large_text')]);
  return r.rows[0];
}
