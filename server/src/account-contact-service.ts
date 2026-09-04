import { query } from './db.js';
const clean=(v:unknown,max:number)=>String(v??'').trim().slice(0,max);
const emailRe=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export async function getAccountContacts(userId:string){
 const r=await query('SELECT email,phone,email_verified_at,phone_verified_at,pending_email,pending_phone,updated_at FROM account_contacts WHERE user_id=$1',[userId]);
 if(r.rows[0])return r.rows[0];
 await query('INSERT INTO account_contacts(user_id) VALUES($1) ON CONFLICT DO NOTHING',[userId]);
 return {email:null,phone:null,email_verified_at:null,phone_verified_at:null,pending_email:null,pending_phone:null};
}
export async function updateAccountContacts(userId:string,input:Record<string,unknown>){
 const current=await getAccountContacts(userId);const email=input.email===undefined?current.email:clean(input.email,254)||null;const phone=input.phone===undefined?current.phone:clean(input.phone,40)||null;
 if(email&&!emailRe.test(email))throw new Error('Invalid email address');
 const r=await query(`INSERT INTO account_contacts(user_id,email,phone,email_verified_at,phone_verified_at,pending_email,pending_phone) VALUES($1,$2,$3,NULL,NULL,NULL,NULL) ON CONFLICT(user_id) DO UPDATE SET email=EXCLUDED.email,phone=EXCLUDED.phone,email_verified_at=CASE WHEN account_contacts.email IS DISTINCT FROM EXCLUDED.email THEN NULL ELSE account_contacts.email_verified_at END,phone_verified_at=CASE WHEN account_contacts.phone IS DISTINCT FROM EXCLUDED.phone THEN NULL ELSE account_contacts.phone_verified_at END,updated_at=now() RETURNING email,phone,email_verified_at,phone_verified_at,pending_email,pending_phone,updated_at`,[userId,email,phone]);
 await query(`INSERT INTO privacy_control_history(user_id,control,value) VALUES($1,'account_contacts',$2)`,[userId,JSON.stringify({email,phone,email_verified_at:r.rows[0].email_verified_at,phone_verified_at:r.rows[0].phone_verified_at})]);
 return r.rows[0];
}
