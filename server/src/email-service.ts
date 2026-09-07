import nodemailer from 'nodemailer';

const host=process.env.SMTP_HOST??'';
const port=Number(process.env.SMTP_PORT??465);
const user=process.env.SMTP_USER??'';
const pass=process.env.SMTP_PASS??'';
const from=process.env.SMTP_FROM??user;
const appUrl=(process.env.PUBLIC_ORIGIN??'https://drustpoll.onrender.com').replace(/\/$/,'');

function transport(){
  if(!host||!user||!pass)throw new Error('Email delivery is not configured.');
  return nodemailer.createTransport({host,port,secure:port===465,auth:{user,pass},tls:{minVersion:'TLSv1.2'},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000});
}
function escapeHtml(value:string){return value.replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]??c));}
function template(code:string,purpose:string,expiresAt:Date){
 const title=purpose==='verify_email'?'Verify your Drustpoll email':purpose==='password_reset'?'Reset your Drustpoll password':'Confirm your Drustpoll security action';
 const intro=purpose==='verify_email'?'Use this code to verify your email and finish creating your account.':purpose==='password_reset'?'Use this code to continue your password recovery.':'Use this code to confirm the requested security action.';
 const year=new Date().getFullYear();
 return {subject:`${code} · ${title}`,text:`${title}\n\n${intro}\n\nCode: ${code}\n\nExpires: ${expiresAt.toISOString()}\n\nNever share this code.\n\nDrustpoll · ${appUrl}`,html:`<!doctype html><html><body style="margin:0;background:#f5f6f2;font-family:Arial,Helvetica,sans-serif;color:#162019"><div style="padding:32px 16px"><div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e1e6df;border-radius:28px;overflow:hidden"><div style="padding:32px;border-bottom:1px solid #e1e6df"><div style="font-size:12px;font-weight:800;letter-spacing:2px;color:#173f35">DRUSTPOLL</div><div style="margin-top:10px;font-size:30px;line-height:36px;font-weight:800">${escapeHtml(title)}</div></div><div style="padding:32px"><div style="font-size:16px;line-height:26px;color:#344238">${escapeHtml(intro)}</div><div style="margin:28px 0;padding:20px;border-radius:20px;background:#e5f0ea;text-align:center"><div style="font-size:12px;letter-spacing:2px;color:#6a756d;font-weight:800">ONE-TIME CODE</div><div style="margin-top:8px;font-size:42px;letter-spacing:10px;font-weight:900;color:#173f35">${escapeHtml(code)}</div></div><div style="font-size:13px;line-height:21px;color:#6a756d">Expires ${escapeHtml(expiresAt.toUTCString())}. Drustpoll will never ask you to share this code with anyone.</div><div style="margin-top:24px;font-size:13px;line-height:21px;color:#6a756d">Open Drustpoll to continue.</div></div><div style="padding:20px 32px;background:#f0f2ec;font-size:11px;color:#6a756d">${year} Drustpoll · Privacy-first social + commerce</div></div></div></body></html>`};
}
export async function sendEmail(to:string,code:string,purpose:string,expiresAt:Date){const mail=template(code,purpose,expiresAt);const t=transport();await t.verify();await t.sendMail({from,to,subject:mail.subject,text:mail.text,html:mail.html});}
