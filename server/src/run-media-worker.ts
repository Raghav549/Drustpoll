import { query } from './db.js';
import { leaseMediaJob, runMediaJob } from './media-processing-worker.js';

const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const workerId=`media-${process.pid}`;

/** Recover upload verification states left behind by a crashed API process. */
async function recoverStaleVerifications(){
  await query(`UPDATE media_assets SET status='pending_upload',updated_at=now() WHERE status='scanning' AND updated_at<now()-interval '15 minutes'`);
}

async function main(){
  let recoveryTick=0;
  for(;;){
    if(++recoveryTick>=60){recoveryTick=0;try{await recoverStaleVerifications();}catch(error){console.error('media verification recovery failed',error);}}
    const job=await leaseMediaJob(workerId);
    if(!job){await sleep(1000);continue;}
    try{await runMediaJob(job);}catch(error){console.error('media job failed',job.id,error);}
  }
}
main().catch(error=>{console.error(error);process.exit(1);});
