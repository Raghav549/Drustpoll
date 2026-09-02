import { leaseFeatureJob, runFeatureJob } from './recommendation-feature-worker.js';
import { httpMultimodalExtractor } from './multimodal-http-extractor.js';

const workerId=`feature-${process.pid}`;
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));

async function main(){
  for(;;){
    const job=await leaseFeatureJob(workerId);
    if(!job){await sleep(1000);continue;}
    try{await runFeatureJob(job,httpMultimodalExtractor);}catch(error){console.error('feature job failed',job.id,error);}
  }
}
main().catch(error=>{console.error(error);process.exit(1);});
