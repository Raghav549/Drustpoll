const base=process.env.API_URL||'https://drustpoll.onrender.com';
const suffix=Date.now().toString(36);
const payload={username:`ci_${suffix}`.slice(0,30),displayName:'CI User',password:'Strong-CI-Password-123!',email:`ci-${suffix}@example.com`};
async function call(path,body){const r=await fetch(`${base}${path}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(`${path}: HTTP ${r.status} ${data.error||''}`);return data;}
const created=await call('/v1/auth/signup',payload);
if(!created?.token||!created?.userId||!created?.deviceId)throw new Error('Signup did not return a usable session.');
const login=await call('/v1/auth/login',{identifier:payload.username,password:payload.password});
if(!login?.token||!login?.userId)throw new Error('Login did not return a usable session.');
console.log(`Auth smoke OK: signup+login succeeded against ${base}`);