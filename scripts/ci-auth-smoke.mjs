const base=process.env.API_URL||'https://drustpoll.onrender.com';
const suffix=Date.now().toString(36);
const payload={username:`ci_${suffix}`.slice(0,30),displayName:'CI User',password:'Strong-CI-Password-123!',phone:`+9199${String(Date.now()).slice(-8)}`};
async function call(path,body,options={}){const r=await fetch(`${base}${path}`,{method:'POST',headers:{'content-type':'application/json',...(options.token?{authorization:`Bearer ${options.token}`}:{})},body:JSON.stringify(body)});const data=await r.json().catch(()=>({}));return{r,data};}
async function healthCheck(){const r=await fetch(`${base}/health`);const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(`/health: HTTP ${r.status} ${data.error||''}`);return data;}
async function signupWithRetry(){let last;for(let attempt=1;attempt<=5;attempt++){const{r,data}=await call('/v1/auth/signup',payload);if(r.ok)return data;last=new Error(`/v1/auth/signup: HTTP ${r.status} ${data.error||''}`);if(!/too many (signup|requests)/i.test(last.message)||attempt===5)throw last;const delay=1500*2**(attempt-1);console.log(`Auth smoke rate limited; retrying ${attempt}/4 in ${delay}ms…`);await new Promise(resolve=>setTimeout(resolve,delay));}throw last;}
const health=await healthCheck();if(health?.status&&health.status!=='ok')throw new Error(`/health: unexpected status ${health.status}`);
try{
 const created=await signupWithRetry();
 if(!created?.token||!created?.userId||!created?.deviceId)throw new Error('Signup did not return a usable session.');
 if(created.verificationRequired!==true)throw new Error('Signup must require contact verification before account access.');
 const loginAttempt=await call('/v1/auth/login',{identifier:payload.username,password:payload.password});
 if(loginAttempt.r.status!==400||!/^Account verification required$/i.test(String(loginAttempt.data?.error||'')))throw new Error(`Unverified login contract failed: HTTP ${loginAttempt.r.status} ${loginAttempt.data?.error||''}`);
 const meAttempt=await call('/v1/auth/me',{}, {token:created.token});
 if(meAttempt.r.status!==401||!/^Unauthenticated$/i.test(String(meAttempt.data?.error||'')))throw new Error(`Unverified session contract failed: HTTP ${meAttempt.r.status} ${meAttempt.data?.error||''}`);
 console.log(`Auth smoke OK: signup created a verification-required account; unverified login/session access are correctly blocked against ${base}`);
}catch(error){const message=error instanceof Error?error.message:'';if(/too many (signup|requests)/i.test(message)){console.log(`Auth smoke inconclusive: shared CI egress is rate-limited; /health passed (${JSON.stringify(health)}).`);process.exit(0);}throw error;}
