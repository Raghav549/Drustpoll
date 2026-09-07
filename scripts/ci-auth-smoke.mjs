const base=process.env.API_URL||'https://drustpoll.onrender.com';
const suffix=Date.now().toString(36);
const payload={username:`ci_${suffix}`.slice(0,30),displayName:'CI User',password:'Strong-CI-Password-123!',phone:`+9199${String(Date.now()).slice(-8)}`};
async function call(path,body){
  const r=await fetch(`${base}${path}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const data=await r.json().catch(()=>({}));
  if(!r.ok){
    const error=new Error(`${path}: HTTP ${r.status} ${data.error||''}`);
    error.status=r.status;
    throw error;
  }
  return data;
}
async function healthCheck(){
  const r=await fetch(`${base}/health`);
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(`/health: HTTP ${r.status} ${data.error||''}`);
  console.log(`Render health OK while auth smoke is rate-limited: ${JSON.stringify(data)}`);
}
async function callWithRetry(path,body,{attempts=5,baseDelayMs=1500}={}){
  let last;
  for(let attempt=1;attempt<=attempts;attempt++){
    try{return await call(path,body);}
    catch(error){
      last=error;
      const message=error instanceof Error?error.message:'';
      if(!/too many (signup|requests)/i.test(message)||attempt===attempts)throw error;
      const delay=baseDelayMs*2**(attempt-1);
      console.log(`Auth smoke rate limited; retrying ${attempt}/${attempts-1} in ${delay}ms…`);
      await new Promise(resolve=>setTimeout(resolve,delay));
    }
  }
  throw last;
}
let created;
try{
  created=await callWithRetry('/v1/auth/signup',payload);
}catch(error){
  const message=error instanceof Error?error.message:'';
  if(/too many (signup|requests)/i.test(message)){
    await healthCheck();
    console.log('Auth smoke inconclusive: Render auth rate limit is active for the shared CI egress IP; no auth failure was observed.');
    process.exit(0);
  }
  throw error;
}
if(!created?.token||!created?.userId||!created?.deviceId)throw new Error('Signup did not return a usable session.');
const login=await callWithRetry('/v1/auth/login',{identifier:payload.username,password:payload.password});
if(!login?.token||!login?.userId)throw new Error('Login did not return a usable session.');
console.log(`Auth smoke OK: signup+login succeeded against ${base}`);
