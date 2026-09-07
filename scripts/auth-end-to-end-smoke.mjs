const base=(process.env.DRUSTPOLL_API_URL??'https://drustpoll.onrender.com').replace(/\/$/,'');
const suffix=Date.now().toString(36).slice(-8);
const username=`smoke_${suffix}`;
const email=`drustpoll-smoke-${suffix}@example.invalid`;
const password='SmokePass!12345';
async function req(path,options={}){const res=await fetch(`${base}${path}`,{...options,headers:{'Content-Type':'application/json',...(options.headers??{})}});const text=await res.text();let data={};try{data=text?JSON.parse(text):{};}catch{};return{res,data};}
const health=await req('/health');if(!health.res.ok||health.data.ok!==true)throw new Error(`health failed: ${health.res.status}`);
const signup=await req('/v1/auth/signup',{method:'POST',body:JSON.stringify({username,displayName:'Smoke Test',password,email})});if(signup.res.status!==201||!signup.data.token)throw new Error(`signup failed: ${signup.res.status} ${JSON.stringify(signup.data)}`);
if(signup.data.verificationRequired!==true)throw new Error('signup did not require verification');
const token=signup.data.token;
const me=await req('/v1/auth/me',{headers:{Authorization:`Bearer ${token}`}});if(me.res.status!==200||!me.data.session?.userId)throw new Error(`auth session failed: ${me.res.status}`);
const otpRequest=await req('/v1/auth/otp/request',{method:'POST',headers:{Authorization:`Bearer ${token}`},body:JSON.stringify({destination:email,purpose:'verify_email'})});
if(![202,400].includes(otpRequest.res.status))throw new Error(`otp request unexpected: ${otpRequest.res.status}`);
const logout=await req('/v1/auth/logout',{method:'POST',headers:{Authorization:`Bearer ${token}`}});if(logout.res.status!==200)throw new Error(`logout failed: ${logout.res.status}`);
console.log(JSON.stringify({ok:true,username,email,signupStatus:signup.res.status,otpRequestStatus:otpRequest.res.status}));
