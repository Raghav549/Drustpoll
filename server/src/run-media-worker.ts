import { leaseMediaJob, runMediaJob } from './media-processing-worker.js';
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));const workerId=`media-${process.pid}`;
async function main(){for(;;){const job=await leaseMediaJob(workerId);if(!job){await sleep(1000);continue;}try{await runMediaJob(job);}catch(error){console.error('media job failed',job.id,error);}}}
main().catch(error=>{console.error(error);process.exit(1);});
