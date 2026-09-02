import { withTransaction } from './db.js';

type Event={surface:string;metric:string;valueNum?:number;valueText?:string;sessionId?:string;clientEventId:string};
const SURFACES=new Set(['home','explore','reels','profile','create','connect','messages','notifications','market','product','cart','checkout','orders','settings','privacy','safety','global']);
const METRICS=new Set(['time_to_useful_content','interaction_latency','task_success','error_recovery','meaningful_interaction','diversity','novelty','negative_feedback','privacy_comprehension','accessibility_defect','media_start_latency','commerce_conversion','return_signal','guardrail_breach','control_change','screen_open','action_result']);
export async function recordUiMeasurements(userId:string,events:Event[]){
 const limited=events.slice(0,100);let accepted=0;const acceptedClientEventIds:string[]=[];
 return withTransaction(async client=>{
  for(const e of limited){
   if(!e.clientEventId||e.clientEventId.length>160||!SURFACES.has(e.surface)||!METRICS.has(e.metric))continue;
   if(e.valueNum!==undefined&&(!Number.isFinite(e.valueNum)||Math.abs(e.valueNum)>1e9))continue;
   const result=await client.query(`INSERT INTO ui_measurements(user_id,surface,metric,value_num,value_text,session_id,client_event_id) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(user_id,client_event_id) DO NOTHING`,[userId,e.surface,e.metric,e.valueNum??null,e.valueText??null,e.sessionId??null,e.clientEventId]);
   if(result.rowCount){accepted++;acceptedClientEventIds.push(e.clientEventId);}
  }
  return{accepted,acceptedClientEventIds};
 });
}
