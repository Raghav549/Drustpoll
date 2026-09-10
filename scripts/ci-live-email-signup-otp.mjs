const base=(process.env.API_URL||'https://drustpoll.onrender.com').replace(/\/$/,'');
const email=String(process.env.TEST_EMAIL||'').trim().toLowerCase();
const password=String(process.env.TEST_PASSWORD||'');
if(!email||!email.includes('@'))throw new Error('TEST_EMAIL is required');
if(password.length<12)throw new Error('TEST_PASSWORD must be at least 12 characters');
const suffix=Date.now().toString(36);
const payload={username:`ci_email_${suffix}`.slice(0,30),displayName:'Drustpoll CI',password,email};
async function post(path,body){const r=await fetch(`${base}${path}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const text=await r.text();let data={};try{data=text?JSON.parse(text):{};}catch{data={raw:text};}return{status:r.status,ok:r.ok,data};}
const health=await fetch(`${base}/health`);if(!health.ok)throw new Error(`health failed: ${health.status}`);const h=await health.json();if(h?.status&&h.status!=='ok')throw new Error(`health status ${h.status}`);
const signup=await post('/v1/auth/signup',payload);
if(!signup.ok)throw new Error(`signup failed: HTTP ${signup.status} ${signup.data?.error||''}`);
if(!signup.data?.token||!signup.data?.userId||signup.data?.verificationRequired!==true)throw new Error('signup did not return verification-required session');
console.log(`Live signup succeeded for ${email}; OTP was requested server-side and a verification-required session was returned.`);
